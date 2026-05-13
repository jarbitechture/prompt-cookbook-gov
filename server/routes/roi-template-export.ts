/**
 * roi-template-export.ts — Task #11
 *
 * POST /api/roi/template-export
 * Body: { target_tool: "copilot" | "chatgpt_enterprise"; mode?: "critique" | "refine" | "preview" | "manual" }
 *
 * Returns 204 No Content on success, 400 on invalid body.
 * Telemetry is fire-and-forget — never blocks the response.
 *
 * `createTemplateExportApp` is exported so the test harness can mount it
 * on a random port without importing the full server.
 */
import express from "express";
import { z } from "zod";
import { emitTemplateExportEvent } from "../lib/roi-emit.js";

// ─── Zod schema ────────────────────────────────────────────────────────────────

const TemplateExportBodySchema = z
  .object({
    target_tool: z.enum(["copilot", "chatgpt_enterprise"]),
    mode: z
      .enum(["critique", "refine", "preview", "manual"])
      .optional(),
  })
  .strict();

// ─── Handler ───────────────────────────────────────────────────────────────────

export async function handleTemplateExport(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  const startTs = Date.now();
  const parsed = TemplateExportBodySchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { target_tool, mode } = parsed.data;
  emitTemplateExportEvent(req, target_tool, mode, startTs);

  res.status(204).end();
}

// ─── Factory (test harness + server.ts mount) ─────────────────────────────────

/**
 * Returns a minimal Express app with the route mounted.
 * Used by roi-emit.test.ts via `app.listen(0)` pattern.
 */
export function createTemplateExportApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.post("/api/roi/template-export", (req, res) => {
    handleTemplateExport(req, res).catch((err) => {
      console.error("[template-export] unhandled:", err);
      if (!res.headersSent) res.status(500).end();
    });
  });
  return app;
}
