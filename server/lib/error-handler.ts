/**
 * error-handler.ts — P0-B
 *
 * Global Express error middleware that scrubs filesystem paths,
 * stack traces, and dependency-manager fingerprints from 4xx/5xx
 * responses.
 *
 * Default Express behavior is to send an HTML response containing
 * the absolute path of the offending module (e.g. body-parser's
 * raw-body) when a 413 (payload too large) or 400 (malformed JSON)
 * fires before the route handler. That is an info-disclosure leak.
 *
 * This middleware MUST be registered AFTER all routes so it runs as
 * a 4-arg Express error handler. Errors raised by `express.json()`
 * (body-parser) carry `err.status` / `err.statusCode`; we map those
 * to stable codes and emit JSON only.
 */

import type express from "express";

/** Map a numeric status to a stable machine-readable code. */
function codeFor(status: number): string {
  if (status === 413) return "payload_too_large";
  if (status === 400) return "bad_request";
  return "internal_error";
}

/**
 * Express error middleware. Returns JSON only; never leaks
 * `err.message`, `err.stack`, or filesystem paths to the wire.
 *
 * Server-side logging still records the status, code, and path
 * via `console.error` so the existing log shipper picks it up.
 */
export function errorHandler(
  err: Error & { status?: number; statusCode?: number },
  req: express.Request,
  res: express.Response,
  // 4-arg signature is required for Express to recognize this as an
  // error handler — `next` is intentionally unused.
  _next: express.NextFunction,
): void {
  const status = err.status ?? err.statusCode ?? 500;
  const code = codeFor(status);

  // Never leak err.message or err.stack — they may contain
  // /Users/<name>/... or node_modules/.pnpm/<dep>@<version> paths.
  if (!res.headersSent) {
    res.status(status).json({
      error: "Request could not be processed",
      code,
    });
  }

  // Server-side log only — safe to record path because logs are
  // not user-facing.
  console.error(
    `[error-handler] status=${status} code=${code} path=${req.path}`,
  );
}
