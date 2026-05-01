/**
 * ROI sidecar — JS port of manatee_ai_roi.sidecar.
 *
 * Operating Rule #18: every LLM-touched workflow emits one event.
 * Operating Rule #19 (#18 corollary): fail-open with circuit breaker.
 *   Telemetry NEVER blocks the LLM call.
 *
 * Posts to the manatee-ai-roi FastAPI surface. If the surface is down,
 * the breaker opens and stops attempting writes for COOLDOWN_MS.
 *
 * Schema mirrors: ~/Projects/manatee-ai-roi/src/manatee_ai_roi/schema.py
 */

const ENDPOINT = process.env.ROI_EVENTS_URL || "http://localhost:8000/v1/events";
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 30_000;
const TIMEOUT_MS = 1_500;

const breaker = {
  state: "closed", // "closed" | "open" | "half_open"
  failures: 0,
  openedAt: 0,
  dropped: 0,
};

function canAttempt() {
  if (breaker.state === "closed") return true;
  if (breaker.state === "open") {
    if (Date.now() - breaker.openedAt >= COOLDOWN_MS) {
      breaker.state = "half_open";
      return true;
    }
    return false;
  }
  return true; // half_open — one probe
}

function recordSuccess() {
  breaker.state = "closed";
  breaker.failures = 0;
}

function recordFailure() {
  breaker.failures += 1;
  breaker.dropped += 1;
  if (breaker.state === "half_open") {
    breaker.state = "open";
    breaker.openedAt = Date.now();
  } else if (breaker.failures >= FAILURE_THRESHOLD) {
    breaker.state = "open";
    breaker.openedAt = Date.now();
  }
}

export function breakerStatus() {
  return {
    state: breaker.state,
    consecutive_failures: breaker.failures,
    dropped_events_total: breaker.dropped,
  };
}

/**
 * Wrap a handler in an emit_event-equivalent.
 *
 * @param {object} ctx — workflow, user_id, dept, role_band, task_type, tool, surface
 * @param {() => Promise<{prompt_tokens?, output_tokens?, success?}>} fn — runs the LLM call
 * @returns whatever fn returns
 */
export async function withRoiEvent(ctx, fn) {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  let success = true;
  let usage = {};
  let result;
  let caught;

  try {
    result = await fn(usage);
  } catch (err) {
    success = false;
    caught = err;
  }

  const event = {
    started_at: startedAt,
    duration_s: Number(((Date.now() - t0) / 1000).toFixed(3)),
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
  };

  emitFireAndForget(event);
  if (caught) throw caught;
  return result;
}

function emitFireAndForget(event) {
  if (!canAttempt()) {
    breaker.dropped += 1;
    return;
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
    signal: ctrl.signal,
  })
    .then((res) => {
      clearTimeout(timer);
      if (res.ok) recordSuccess();
      else recordFailure();
    })
    .catch(() => {
      clearTimeout(timer);
      recordFailure();
    });
}
