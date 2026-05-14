/**
 * roi-pii-flagged.ts — P0-A demo-block patch (2026-05-14)
 *
 * POST /api/roi/pii-flagged
 * Body:
 *   {
 *     pattern_types: string[]        // e.g. ["ssn", "us_phone", "email"]
 *     match_count:   number          // total matches across all patterns
 *     action:        "blocked" | "send_anyway" | "redact_and_send"
 *     target_tool?:  "copilot" | "chatgpt_enterprise"
 *   }
 *
 * Returns 204 on success, 400 on invalid body.
 * Telemetry is fire-and-forget — never blocks the response.
 *
 * Privacy contract: this endpoint NEVER receives raw matches or the
 * scanned prompt text. Only pattern names + counts. If a future client
 * accidentally tries to send raw text, zod `.strict()` will reject the
 * extra field.
 */
import express from "express";
import { z } from "zod";
import { emitPiiFlaggedEvent } from "../lib/roi-emit.js";

// ─── Zod schema ────────────────────────────────────────────────────────────────

const PiiFlaggedBodySchema = z
  .object({
    // Whitelist of allowed pattern names — keep in lockstep with
    // client/src/lib/pre-send-scan.ts PATTERN_NAMES.
    pattern_types: z.array(
      z.enum(["ssn", "us_phone", "email", "credit_card", "dollar_amount_large"])
    ),
    match_count: z.number().int().min(0).max(1000),
    action: z.enum(["blocked", "send_anyway", "redact_and_send"]),
    target_tool: z.enum(["copilot", "chatgpt_enterprise"]).optional(),
  })
  .strict();

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function handlePiiFlagged(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  const startTs = Date.now();
  const parsed = PiiFlaggedBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { pattern_types, match_count, action, target_tool } = parsed.data;
  emitPiiFlaggedEvent(req, pattern_types, match_count, action, target_tool, startTs);

  res.status(204).end();
}
