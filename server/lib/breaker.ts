/**
 * Circuit breaker wrapping the Civic AI governed proxy client.
 *
 * Config (per ADR-002 / §4 of 2026-05-12-cookbook-mvp.md):
 *   timeout              10 s   — call is considered failed if it takes longer
 *   errorThresholdPct    50 %   — open when >50% of calls fail within a 5-call window.
 *                               Cannot use 100 — opossum uses strict `>` comparison, so
 *                               a 100% failure rate would never trip the breaker.
 *   volumeThreshold       5    — minimum requests in window before the breaker can open
 *   resetTimeout         30 s   — half-open probe fires 30 s after opening
 *   rollingCountTimeout  60 s   — statistical window
 *   rollingCountBuckets   6    — 10 s per bucket
 *
 * Excluded from tripping (errorFilter → true):
 *   400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable
 *   These are deterministic client errors that don't indicate infrastructure failure.
 *
 * Half-open single-probe enforcement: opossum natively allows exactly one probe
 * request after resetTimeout — no additional configuration needed.
 * (capacity: 1 was intentionally omitted — it serialises ALL calls, not just probes.)
 */

import CircuitBreaker from "opossum";
import { callCivicAi, type CivicAiMessage, type CivicAiOptions } from "./civic-ai-client.js";

// Status codes that should NOT count as infrastructure failures.
const EXCLUDED_STATUSES = new Set([400, 401, 403, 404, 422]);

const breaker = new CircuitBreaker(
  (messages: CivicAiMessage[], options?: CivicAiOptions) =>
    callCivicAi(messages, options),
  {
    name: "civic-ai",
    timeout: 10_000,
    errorThresholdPercentage: 50,
    volumeThreshold: 5,
    resetTimeout: 30_000,
    rollingCountTimeout: 60_000,
    rollingCountBuckets: 6,
    errorFilter: (err: unknown): boolean => {
      if (
        err !== null &&
        typeof err === "object" &&
        "status" in err &&
        typeof (err as { status: unknown }).status === "number"
      ) {
        return EXCLUDED_STATUSES.has((err as { status: number }).status);
      }
      return false;
    },
  },
);

// Track the timestamp of the last infrastructure failure for the health endpoint.
let lastFailureTs: number | null = null;

breaker.on("failure", (_err: Error) => {
  lastFailureTs = Date.now();
});

// Fallback: return a sentinel object so callers can detect breaker-open
// without throwing (Task #4 endpoints check for __breaker_open).
breaker.fallback(
  (_messages: CivicAiMessage[], _options?: CivicAiOptions, err?: Error) => {
    // Log for ops visibility; don't surface internal detail to clients.
    if (err) {
      console.error("[civic-ai breaker] fallback triggered:", err.message);
    }
    return { __breaker_open: true, message: "Coach feedback temporarily unavailable" };
  },
);

export { breaker };

export function getBreakerState(): {
  state: "closed" | "open" | "halfOpen";
  failure_count: number;
  last_failure_ts: number | null;
} {
  let state: "closed" | "open" | "halfOpen";
  if (breaker.opened) {
    state = "open";
  } else if (breaker.halfOpen) {
    state = "halfOpen";
  } else {
    state = "closed";
  }

  return {
    state,
    failure_count: breaker.stats.failures,
    last_failure_ts: lastFailureTs,
  };
}
