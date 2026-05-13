/**
 * roi-emit.ts — Task #9
 *
 * Centralises ROI event construction for the three coach endpoints
 * (/api/critique, /api/refine, /api/preview).
 *
 * IIS header assumption: iisaf-Username, iisaf-Dept, iisaf-RoleBand are
 * populated by IIS ARR's serverVariables → customHeaders forwarding.
 * That forwarding rule is NOT yet configured in iis-setup.ps1 (out of
 * scope Task #9). Until it is, all requests fall through to the defaults:
 *   user_id  → "anonymous"
 *   dept     → "unknown"
 *   role_band → "professional"
 */

import type express from "express";
import {
  emitEvent,
  EventKind,
} from "../../api/src/lib/roi-sidecar.js";

// ─── Types ────────────────────────────────────────────────────────────────────

type CoachMode = "critique" | "refine" | "preview";

// ─── task_type mapping per mode ───────────────────────────────────────────────

const TASK_TYPE: Record<CoachMode, string> = {
  critique: "prompt_evaluation",
  refine:   "prompt_rewrite",
  preview:  "prompt_simulation",
};

const EVENT_KIND: Record<CoachMode, string> = {
  critique: EventKind.PROMPT_CRITIQUE,
  refine:   EventKind.PROMPT_REFINE,
  preview:  EventKind.PROMPT_PREVIEW,
};

// ─── Header extraction ────────────────────────────────────────────────────────

function extractContext(req: express.Request) {
  return {
    user_id:   (req.headers["iisaf-username"] as string | undefined)  ?? "anonymous",
    dept:      (req.headers["iisaf-dept"]     as string | undefined)  ?? "unknown",
    role_band: (req.headers["iisaf-roleband"] as string | undefined)  ?? "professional",
  };
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

/**
 * Emit one PROMPT_<MODE> event covering the entire endpoint request.
 *
 * @param req      — Express request (for header extraction)
 * @param mode     — "critique" | "refine" | "preview"
 * @param success  — true on HTTP 200, false on any error response
 * @param startTs  — `Date.now()` captured at handler entry
 * @param traceId  — W3C trace_id shared with sibling LLM_CALL events
 * @param extra    — optional extra fields merged into the event
 */
export function emitPromptEvent(
  req: express.Request,
  mode: CoachMode,
  success: boolean,
  startTs: number,
  traceId: string,
  extra?: Record<string, unknown>
): void {
  const { user_id, dept, role_band } = extractContext(req);
  emitEvent({
    event_kind:  EVENT_KIND[mode],
    workflow:    "cookbook",
    user_id,
    dept,
    role_band,
    task_type:   TASK_TYPE[mode],
    tool:        "cookbook",
    surface:     "web",
    duration_s:  Number(((Date.now() - startTs) / 1000).toFixed(3)),
    success,
    trace_id:    traceId,
    ...extra,
  });
}

/**
 * Emit one TEMPLATE_EXPORT event for a Send-to-Copilot / Send-to-ChatGPT handoff.
 *
 * @param req        — Express request (for header extraction)
 * @param targetTool — "copilot" | "chatgpt_enterprise"
 * @param mode       — originating coach mode, or undefined when opened from BuildMode
 * @param startTs    — `Date.now()` captured at handler entry
 */
export function emitTemplateExportEvent(
  req: express.Request,
  targetTool: "copilot" | "chatgpt_enterprise",
  mode: "critique" | "refine" | "preview" | "manual" | undefined,
  startTs: number,
): void {
  const { user_id, dept, role_band } = extractContext(req);
  emitEvent({
    event_kind:  EventKind.TEMPLATE_EXPORT,
    workflow:    "cookbook",
    user_id,
    dept,
    role_band,
    task_type:   "template_export",
    tool:        "cookbook",
    surface:     "web",
    duration_s:  Number(((Date.now() - startTs) / 1000).toFixed(3)),
    success:     true,
    target_tool: targetTool,
    ...(mode !== undefined ? { mode } : {}),
  });
}

/**
 * Emit one LLM_CALL event for a single civic-ai breaker call.
 *
 * Called once per `callAndParse` invocation (including retries).
 * Token counts are 0/0 for MVP — civic-ai-client does not yet expose
 * usage metadata. TODO: wire up when usage is surfaced.
 *
 * @param req          — Express request (for header extraction)
 * @param mode         — parent mode (used to derive task_type)
 * @param success      — false if callAndParse returned ok=false
 * @param callDurationMs — elapsed ms for this single call
 * @param traceId      — shared with sibling PROMPT_<MODE> event
 * @param extra        — optional extra fields (e.g. breaker_state)
 */
export function emitLlmCallEvent(
  req: express.Request,
  mode: CoachMode,
  success: boolean,
  callDurationMs: number,
  traceId: string,
  extra?: Record<string, unknown>
): void {
  const { user_id, dept, role_band } = extractContext(req);
  emitEvent({
    event_kind:     EventKind.LLM_CALL,
    workflow:       "cookbook",
    user_id,
    dept,
    role_band,
    task_type:      "llm_inference",
    tool:           "cookbook",
    surface:        "web",
    duration_s:     Number((callDurationMs / 1000).toFixed(3)),
    success,
    trace_id:       traceId,
    // TODO: set real counts when civic-ai-client surfaces usage metadata.
    prompt_tokens:  0,
    output_tokens:  0,
    ...extra,
  });
}
