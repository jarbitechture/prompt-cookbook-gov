/**
 * ROI sidecar — JS port of manatee_ai_roi.sidecar.A_Plus_Client.
 *
 * Operating Rule #18 (broadened 2026-05-06): every user-facing action and
 * tool/agent invocation emits one ROI event. Architecture A+:
 *
 *   1. POST primary to manatee-ai-roi FastAPI
 *   2. On failure → append to local fallback JSONL
 *   3. Background drain replays fallback entries when breaker recovers
 *
 * Telemetry NEVER blocks the user-facing action.
 *
 * Schema mirrors: ~/Projects/manatee-ai-roi/src/manatee_ai_roi/schema.py 1.1.0
 */

import { promises as fs } from "node:fs";
import { dirname } from "node:path";

const ENDPOINT = (
  process.env.ROI_EVENTS_URL || "http://localhost:8000"
).replace(/\/+$/, "");
const FALLBACK_PATH =
  process.env.ROI_FALLBACK_PATH ||
  `${process.env.HOME || process.env.USERPROFILE || "."}/.cache/manatee-ai-roi/fallback.jsonl`;
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 30_000;
const TIMEOUT_MS = 3_000; // spec §9: raised from 1.5s based on county VLAN p99
const DRAIN_INTERVAL_MS = 60_000;

// EventKind values mirror manatee_ai_roi.schema.EventKind (16 values, schema 1.2.0).
// 11 original + 5 ADR-007 lifecycle kinds (session_start, prompt_received,
// stream_complete, citation_surfaced, followup_action).
// 3 cookbook-specific kinds (prompt_critique, prompt_refine, prompt_preview)
// added in cookbook Task #9 for Tier 1-4 KPI dashboards.
export const EventKind = Object.freeze({
  LLM_CALL: "llm_call",
  TOOL_INVOCATION: "tool_invocation",
  GPT_PICK: "gpt_pick",
  PROJECT_ACCESS: "project_access",
  FILE_INTERACTION: "file_interaction",
  RAG_HIT: "rag_hit",
  LICENSE_LIFECYCLE: "license_lifecycle",
  HEADCOUNT_ATTESTATION: "headcount_attestation",
  FEEDBACK: "feedback",
  ESCALATION: "escalation",
  TRAINING_INTERACTION: "training_interaction",
  // ADR-007 lifecycle kinds (one user action emits N events sharing trace_id)
  SESSION_START: "session_start",
  PROMPT_RECEIVED: "prompt_received",
  STREAM_COMPLETE: "stream_complete",
  CITATION_SURFACED: "citation_surfaced",
  FOLLOWUP_ACTION: "followup_action",
  // Cookbook coach endpoint kinds (Task #9)
  PROMPT_CRITIQUE: "prompt_critique",
  PROMPT_REFINE: "prompt_refine",
  PROMPT_PREVIEW: "prompt_preview",
  // Cookbook handoff kind (Task #11)
  TEMPLATE_EXPORT: "template_export",
});

/** Generate a fresh W3C-compatible trace_id (32 lowercase hex chars). */
export function newTraceId() {
  const bytes = new Uint8Array(16);
  (globalThis.crypto || require("node:crypto").webcrypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a fresh W3C-compatible span_id (16 lowercase hex chars). */
export function newSpanId() {
  const bytes = new Uint8Array(8);
  (globalThis.crypto || require("node:crypto").webcrypto).getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const VALID_KINDS = new Set(Object.values(EventKind));

const breaker = {
  state: "closed", // "closed" | "open" | "half_open"
  failures: 0,
  openedAt: 0,
  droppedTotal: 0,
};

const stats = {
  lastDrainTs: null,
  lastDrainCount: 0,
  drainedTotal: 0,
};

let _drainTimer = null;

// ─── breaker ─────────────────────────────────────────────────────────────────

function canAttempt() {
  if (breaker.state === "closed") return true;
  if (breaker.state === "open") {
    if (Date.now() - breaker.openedAt >= COOLDOWN_MS) {
      breaker.state = "half_open";
      return true;
    }
    return false;
  }
  return true; // half_open
}

function recordSuccess() {
  breaker.state = "closed";
  breaker.failures = 0;
}

function recordFailure() {
  breaker.failures += 1;
  breaker.droppedTotal += 1;
  if (breaker.state === "half_open") {
    breaker.state = "open";
    breaker.openedAt = Date.now();
  } else if (breaker.failures >= FAILURE_THRESHOLD) {
    breaker.state = "open";
    breaker.openedAt = Date.now();
  }
}

// ─── validation (mirrors RoiEvent.validate_for_persistence) ──────────────────

function validateForPersistence(event) {
  const required = [
    "event_kind", "workflow", "user_id", "dept", "role_band",
    "task_type", "tool", "success",
  ];
  for (const k of required) {
    if (!(k in event)) throw new Error(`missing required field: ${k}`);
  }
  if (!VALID_KINDS.has(event.event_kind)) {
    throw new Error(`invalid event_kind: ${event.event_kind}`);
  }
  if (event.event_kind === EventKind.LLM_CALL) {
    if (event.prompt_tokens == null || event.output_tokens == null) {
      throw new Error(
        "event_kind=llm_call requires both prompt_tokens and output_tokens"
      );
    }
  }
}

// ─── fallback queue (append-only JSONL) ──────────────────────────────────────

async function fallbackAppend(event) {
  try {
    await fs.mkdir(dirname(FALLBACK_PATH), { recursive: true });
    await fs.appendFile(FALLBACK_PATH, JSON.stringify(event) + "\n", "utf-8");
  } catch (_e) {
    // Last-resort fail-open: even fallback is broken. Bump dropped counter.
    breaker.droppedTotal += 1;
  }
}

async function fallbackCount() {
  try {
    const text = await fs.readFile(FALLBACK_PATH, "utf-8");
    return text.split("\n").filter((l) => l.trim()).length;
  } catch (_e) {
    return 0;
  }
}

async function fallbackDrain() {
  let lines;
  try {
    const text = await fs.readFile(FALLBACK_PATH, "utf-8");
    lines = text.split("\n").filter((l) => l.trim());
  } catch (_e) {
    return { drained: 0, remaining: 0 };
  }
  if (lines.length === 0) return { drained: 0, remaining: 0 };

  let drained = 0;
  for (let i = 0; i < lines.length; i++) {
    const ok = await postRawLine(lines[i]);
    if (!ok) {
      const remaining = lines.slice(i);
      await fs.writeFile(FALLBACK_PATH, remaining.join("\n") + "\n", "utf-8");
      return { drained, remaining: remaining.length };
    }
    drained += 1;
  }
  await fs.writeFile(FALLBACK_PATH, "", "utf-8");
  return { drained, remaining: 0 };
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

async function post(event) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}/v1/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(event),
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function postRawLine(jsonLine) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}/v1/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: jsonLine,
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export function startDrainLoop() {
  if (_drainTimer) return;
  _drainTimer = setInterval(async () => {
    if (breaker.state !== "closed") return;
    const count = await fallbackCount();
    if (count === 0) return;
    const { drained } = await fallbackDrain();
    stats.lastDrainTs = Date.now();
    stats.lastDrainCount = drained;
    stats.drainedTotal += drained;
  }, DRAIN_INTERVAL_MS);
  // Don't keep the event loop alive solely for drain
  if (_drainTimer && typeof _drainTimer.unref === "function") {
    _drainTimer.unref();
  }
}

export function stopDrainLoop() {
  if (_drainTimer) {
    clearInterval(_drainTimer);
    _drainTimer = null;
  }
}

export async function breakerStatus() {
  return {
    state: breaker.state,
    consecutive_failures: breaker.failures,
    dropped_events_total: breaker.droppedTotal,
    fallback_count: await fallbackCount(),
    last_drain_ts: stats.lastDrainTs,
    last_drain_count: stats.lastDrainCount,
    drained_total: stats.drainedTotal,
  };
}

/**
 * Wrap an async handler in a single ROI event emission.
 *
 * @param {object} ctx — { workflow, user_id, dept, role_band, task_type, tool, surface?, event_kind? }
 * @param {(usage: object) => Promise<any>} fn — runs the work; mutates `usage` to set prompt_tokens/output_tokens
 */
export async function withRoiEvent(ctx, fn) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  let success = true;
  const usage = {};
  let result;
  let caught;

  try {
    result = await fn(usage);
  } catch (err) {
    success = false;
    caught = err;
  }

  const event = {
    event_id: cryptoRandomUUID(),
    started_at: startedAt,
    duration_s: Number(((Date.now() - t0) / 1000).toFixed(3)),
    event_kind: ctx.event_kind || EventKind.LLM_CALL,
    workflow: ctx.workflow,
    user_id: ctx.user_id,
    dept: ctx.dept,
    role_band: ctx.role_band,
    task_type: ctx.task_type,
    tool: ctx.tool,
    surface: ctx.surface || "other",
    prompt_tokens: usage.prompt_tokens ?? null,
    output_tokens: usage.output_tokens ?? null,
    success,
    // ADR-007: lifecycle grouping — pass ctx.trace_id to group with other
    // events from the same user action.
    trace_id: ctx.trace_id ?? null,
    span_id: ctx.span_id ?? null,
    parent_event_id: ctx.parent_event_id ?? null,
  };

  await dispatch(event);

  if (caught) throw caught;
  return result;
}

/**
 * Fire-and-forget ROI event emission (Task #9).
 *
 * Builds a complete event from `partial`, fills defaults, then calls
 * `void dispatch(event)` so emission NEVER blocks the caller.
 *
 * Required fields in partial: event_kind, workflow, user_id, dept,
 * role_band, task_type, tool, success.
 * Optional: started_at, duration_s, surface, prompt_tokens,
 * output_tokens, trace_id, span_id, parent_event_id.
 *
 * @param {object} partial
 */
export function emitEvent(partial) {
  const event = {
    event_id: cryptoRandomUUID(),
    started_at: partial.started_at ?? new Date().toISOString(),
    duration_s: partial.duration_s ?? 0,
    surface: "other",
    prompt_tokens: null,
    output_tokens: null,
    trace_id: null,
    span_id: null,
    parent_event_id: null,
    ...partial,
  };
  void dispatch(event);
}

async function dispatch(event) {
  try {
    validateForPersistence(event);
  } catch (_e) {
    breaker.droppedTotal += 1;
    return;
  }
  if (!canAttempt()) {
    await fallbackAppend(event);
    return;
  }
  const ok = await post(event);
  if (ok) {
    recordSuccess();
  } else {
    await fallbackAppend(event);
    recordFailure();
  }
}

function cryptoRandomUUID() {
  // Node 19+ has crypto.randomUUID
  try {
    return globalThis.crypto.randomUUID();
  } catch {
    // Fallback for older Node
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
