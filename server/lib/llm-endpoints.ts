/**
 * llm-endpoints.ts
 *
 * Shared orchestration for the three coach endpoints:
 *   POST /api/critique, /api/refine, /api/preview
 *
 * Pipeline per request:
 *   1. Parse + validate request body (Zod)
 *   2. Load cached system prompt template
 *   3. Retrieve relevant chapters (keyword RAG)
 *   4. Substitute {{retrieved_chapters}} in template
 *   5. Call civic-ai via circuit breaker
 *   6. Parse JSON + validate against mode schema (one retry on failure)
 *   7. Run regex post-filter; for refine, retry once on filter rejection
 *   8. Return structured response
 *
 * NOTE (build gap): prompt .md files are loaded at module init via
 * fs.readFileSync relative to this file. The esbuild prod bundle places
 * compiled output in dist/ but does NOT copy server/prompts/ — the build
 * step must be extended to cp server/prompts dist/prompts before these
 * routes can serve traffic in production. pnpm run check passes regardless.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import express from "express";
import { breaker } from "./breaker.js";
import type { CivicAiMessage, CivicAiOptions } from "./civic-ai-client.js";
import { retrieveContext } from "./chapter-retrieval.js";
import { filterOutput } from "./output-filter.js";
import type { FilterMode } from "./output-filter.js";
import { chapters } from "../../client/src/lib/cookbookData.js";
import { CritiqueSchema } from "../schemas/critique.js";
import type { Critique } from "../schemas/critique.js";
import { RefineSchema } from "../schemas/refine.js";
import type { Refine } from "../schemas/refine.js";
import { PreviewSchema } from "../schemas/preview.js";
import type { Preview } from "../schemas/preview.js";
import { newTraceId } from "../../api/src/lib/roi-sidecar.js";
import { emitPromptEvent, emitLlmCallEvent } from "./roi-emit.js";

// ─── Prompt template cache ────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.resolve(__dirname, "..", "prompts");

function loadPrompt(mode: "critique" | "refine" | "preview"): string {
  return fs.readFileSync(path.join(PROMPTS_DIR, `${mode}.md`), "utf-8");
}

const TEMPLATES = {
  critique: loadPrompt("critique"),
  refine: loadPrompt("refine"),
  preview: loadPrompt("preview"),
} as const;

// ─── Per-mode config ──────────────────────────────────────────────────────────

const TEMPERATURES: Record<"critique" | "refine" | "preview", number> = {
  critique: 0.2,
  refine: 0.2,
  preview: 0.5,
};

// ─── Request body schemas ─────────────────────────────────────────────────────

const CritiqueBodySchema = z
  .object({ prompt: z.string().min(1).max(10_000) })
  .strict();

const RefineBodySchema = z
  .object({
    prompt: z.string().min(1).max(10_000),
    chapter_id: z.number().int().min(1).max(30).optional(),
  })
  .strict();

const PreviewBodySchema = z
  .object({ prompt: z.string().min(1).max(10_000) })
  .strict();

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Build the `RetrievalResult.formatted` markdown string inline,
 * mirroring the private `formatContext` function in chapter-retrieval.ts.
 * Used by the refine chapter_id override path.
 */
function buildFormattedContext(
  fullChapterContent: string[],
  fullChapterNumber: number,
  fullChapterTitle: string,
  summaries: { chapterNumber: number; title: string; summary: string }[]
): string {
  const lines: string[] = [];
  lines.push("## Top-matched chapter (full content)");
  lines.push(`### Chapter ${fullChapterNumber}: ${fullChapterTitle}`);
  lines.push("");
  lines.push(fullChapterContent.join("\n\n"));

  if (summaries.length > 0) {
    lines.push("");
    lines.push("## Related chapter summaries");
    for (const s of summaries) {
      lines.push(`### Chapter ${s.chapterNumber}: ${s.title}`);
      lines.push("");
      lines.push(s.summary);
      lines.push("");
    }
  }

  return lines.join("\n").trimEnd();
}

/** Strict JSON-reminder prefix added to system prompt on retry. */
const JSON_RETRY_PREFIX =
  "CRITICAL: Your previous response was not valid JSON or did not match the required schema. " +
  "Respond ONLY with a valid JSON object matching the schema. No prose, no markdown fences, no explanation. " +
  "Your entire response must be parseable by JSON.parse().\n\n";

/**
 * Call the civic-ai breaker and parse the returned string as JSON.
 * Returns `{ ok: true, data: unknown }` on success,
 *         `{ ok: false, breakerOpen: true }` when breaker is open,
 *         `{ ok: false, breakerOpen: false, error: string }` on upstream / parse error.
 */
async function callAndParse(
  messages: CivicAiMessage[],
  options: CivicAiOptions
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; breakerOpen: true }
  | { ok: false; breakerOpen: false; error: string }
> {
  let raw: unknown;
  try {
    raw = await breaker.fire(messages, options);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, breakerOpen: false, error: msg };
  }

  // Fallback sentinel — breaker is open.
  if (
    typeof raw === "object" &&
    raw !== null &&
    "__breaker_open" in raw
  ) {
    return { ok: false, breakerOpen: true };
  }

  if (typeof raw !== "string") {
    return { ok: false, breakerOpen: false, error: "Unexpected non-string response from civic-ai" };
  }

  // Strip markdown code fences if present.
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return { ok: true, data: JSON.parse(stripped) };
  } catch {
    return { ok: false, breakerOpen: false, error: `JSON parse failure: ${raw.slice(0, 200)}` };
  }
}

// ─── Per-mode endpoint handlers ───────────────────────────────────────────────

export async function handleCritique(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const startTs = Date.now();
  const traceId = newTraceId();

  const parsed = CritiqueBodySchema.safeParse(req.body);
  if (!parsed.success) {
    emitPromptEvent(req, "critique", false, startTs, traceId);
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  const { prompt } = parsed.data;

  const retrieval = retrieveContext(prompt);
  const systemPrompt = TEMPLATES.critique.replace(
    "{{retrieved_chapters}}",
    retrieval.formatted
  );

  const messages: CivicAiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];
  const options: CivicAiOptions = {
    temperature: TEMPERATURES.critique,
    max_tokens: 600,
    response_format: { type: "json_object" },
    traceId,
  };

  // First attempt
  const call1Start = Date.now();
  let callResult = await callAndParse(messages, options);
  emitLlmCallEvent(req, "critique", callResult.ok, Date.now() - call1Start, traceId,
    callResult.ok ? undefined : { breaker_state: callResult.breakerOpen ? "open" : "closed" });

  if (!callResult.ok && callResult.breakerOpen) {
    emitPromptEvent(req, "critique", false, startTs, traceId, { breaker_state: "open" });
    res.status(503).json({ error: "Coach feedback temporarily unavailable" });
    return;
  }

  if (!callResult.ok) {
    // Retry with stricter JSON directive
    const retryMessages: CivicAiMessage[] = [
      { role: "system", content: JSON_RETRY_PREFIX + systemPrompt },
      { role: "user", content: prompt },
    ];
    const call2Start = Date.now();
    callResult = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "critique", callResult.ok, Date.now() - call2Start, traceId,
      callResult.ok ? undefined : { breaker_state: callResult.breakerOpen ? "open" : "closed" });
  }

  if (!callResult.ok) {
    emitPromptEvent(req, "critique", false, startTs, traceId,
      callResult.breakerOpen ? { breaker_state: "open" } : undefined);
    if (callResult.breakerOpen) {
      res.status(503).json({ error: "Coach feedback temporarily unavailable" });
    } else {
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
    }
    return;
  }

  // Zod schema validation
  let validated: Critique;
  let zodResult = CritiqueSchema.safeParse(callResult.data);

  if (!zodResult.success) {
    // One retry
    const retryMessages: CivicAiMessage[] = [
      { role: "system", content: JSON_RETRY_PREFIX + systemPrompt },
      { role: "user", content: prompt },
    ];
    const call3Start = Date.now();
    const retryCall = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "critique", retryCall.ok, Date.now() - call3Start, traceId,
      retryCall.ok ? undefined : { breaker_state: retryCall.breakerOpen ? "open" : "closed" });
    if (!retryCall.ok) {
      emitPromptEvent(req, "critique", false, startTs, traceId,
        retryCall.breakerOpen ? { breaker_state: "open" } : undefined);
      if (retryCall.breakerOpen) {
        res.status(503).json({ error: "Coach feedback temporarily unavailable" });
      } else {
        res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      }
      return;
    }
    zodResult = CritiqueSchema.safeParse(retryCall.data);
    if (!zodResult.success) {
      emitPromptEvent(req, "critique", false, startTs, traceId);
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      return;
    }
  }

  validated = zodResult.data;

  // Output filter (critique: redact, never reject)
  const filtered = filterOutput<Critique>(validated, "critique" as FilterMode);

  emitPromptEvent(req, "critique", true, startTs, traceId);
  res.status(200).json({
    result: filtered.clean,
    flags: filtered.flags,
  });
}

export async function handleRefine(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const startTs = Date.now();
  const traceId = newTraceId();

  const parsed = RefineBodySchema.safeParse(req.body);
  if (!parsed.success) {
    emitPromptEvent(req, "refine", false, startTs, traceId);
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  const { prompt, chapter_id } = parsed.data;

  // Chapter retrieval — with optional chapter_id override
  let formattedContext: string;

  if (chapter_id !== undefined) {
    const pinnedChapter = chapters.find((c) => c.number === chapter_id);
    if (!pinnedChapter) {
      emitPromptEvent(req, "refine", false, startTs, traceId);
      res.status(400).json({ error: `Unknown chapter_id: ${chapter_id}` });
      return;
    }
    // Use pinned chapter as the full chapter; fill summaries from keyword retrieval,
    // excluding the pinned chapter to avoid duplication.
    const keywordRetrieval = retrieveContext(prompt, 3);
    const summaries = keywordRetrieval.summaries.filter(
      (s) => s.chapterNumber !== chapter_id
    );
    // Also exclude pinnedChapter from keyword fullChapter if it happens to be the same
    if (
      keywordRetrieval.fullChapter !== null &&
      keywordRetrieval.fullChapter.number === chapter_id
    ) {
      // fullChapter is already pinned; keep summaries as-is
      formattedContext = buildFormattedContext(
        pinnedChapter.content,
        pinnedChapter.number,
        pinnedChapter.title,
        summaries
      );
    } else {
      // Keyword retrieval returned a different fullChapter — add it as a summary too
      const extraSummaries = [...summaries];
      if (keywordRetrieval.fullChapter !== null) {
        extraSummaries.unshift({
          chapterNumber: keywordRetrieval.fullChapter.number,
          title: keywordRetrieval.fullChapter.title,
          summary: keywordRetrieval.fullChapter.summary,
        });
      }
      formattedContext = buildFormattedContext(
        pinnedChapter.content,
        pinnedChapter.number,
        pinnedChapter.title,
        extraSummaries.slice(0, 2)
      );
    }
  } else {
    const retrieval = retrieveContext(prompt);
    formattedContext = retrieval.formatted;
  }

  const systemPrompt = TEMPLATES.refine.replace(
    "{{retrieved_chapters}}",
    formattedContext
  );

  const messages: CivicAiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];
  const options: CivicAiOptions = {
    temperature: TEMPERATURES.refine,
    max_tokens: 600,
    response_format: { type: "json_object" },
    traceId,
  };

  // First attempt
  const r1Start = Date.now();
  let callResult = await callAndParse(messages, options);
  emitLlmCallEvent(req, "refine", callResult.ok, Date.now() - r1Start, traceId,
    callResult.ok ? undefined : { breaker_state: callResult.breakerOpen ? "open" : "closed" });

  if (!callResult.ok && callResult.breakerOpen) {
    emitPromptEvent(req, "refine", false, startTs, traceId, { breaker_state: "open" });
    res.status(503).json({ error: "Coach feedback temporarily unavailable" });
    return;
  }

  if (!callResult.ok) {
    const retryMessages: CivicAiMessage[] = [
      { role: "system", content: JSON_RETRY_PREFIX + systemPrompt },
      { role: "user", content: prompt },
    ];
    const r2Start = Date.now();
    callResult = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "refine", callResult.ok, Date.now() - r2Start, traceId,
      callResult.ok ? undefined : { breaker_state: callResult.breakerOpen ? "open" : "closed" });
  }

  if (!callResult.ok) {
    emitPromptEvent(req, "refine", false, startTs, traceId,
      callResult.breakerOpen ? { breaker_state: "open" } : undefined);
    if (callResult.breakerOpen) {
      res.status(503).json({ error: "Coach feedback temporarily unavailable" });
    } else {
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
    }
    return;
  }

  // Zod schema validation
  let validated: Refine;
  let zodResult = RefineSchema.safeParse(callResult.data);

  if (!zodResult.success) {
    const retryMessages: CivicAiMessage[] = [
      { role: "system", content: JSON_RETRY_PREFIX + systemPrompt },
      { role: "user", content: prompt },
    ];
    const r3Start = Date.now();
    const retryCall = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "refine", retryCall.ok, Date.now() - r3Start, traceId,
      retryCall.ok ? undefined : { breaker_state: retryCall.breakerOpen ? "open" : "closed" });
    if (!retryCall.ok) {
      emitPromptEvent(req, "refine", false, startTs, traceId,
        retryCall.breakerOpen ? { breaker_state: "open" } : undefined);
      if (retryCall.breakerOpen) {
        res.status(503).json({ error: "Coach feedback temporarily unavailable" });
      } else {
        res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      }
      return;
    }
    zodResult = RefineSchema.safeParse(retryCall.data);
    if (!zodResult.success) {
      emitPromptEvent(req, "refine", false, startTs, traceId);
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      return;
    }
  }

  validated = zodResult.data;

  // Output filter — refine mode: clean unchanged, reject=true if flags fire
  const filtered = filterOutput<Refine>(validated, "refine" as FilterMode);

  if (filtered.reject) {
    // One retry on filter rejection
    const retryMessages: CivicAiMessage[] = [
      {
        role: "system",
        content:
          "CRITICAL: Your previous response contained hallucinated county-specific content " +
          "(Florida statute citations, dollar amounts, ordinance sections, or FY budget references). " +
          "These are FORBIDDEN. Do NOT include any such content. " +
          "Use generic placeholders like [INSERT VALUE] instead.\n\n" +
          systemPrompt,
      },
      { role: "user", content: prompt },
    ];
    const r4Start = Date.now();
    const retryCall = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "refine", retryCall.ok, Date.now() - r4Start, traceId,
      retryCall.ok ? undefined : { breaker_state: retryCall.breakerOpen ? "open" : "closed" });
    if (!retryCall.ok) {
      emitPromptEvent(req, "refine", false, startTs, traceId,
        retryCall.breakerOpen ? { breaker_state: "open" } : undefined);
      if (retryCall.breakerOpen) {
        res.status(503).json({ error: "Coach feedback temporarily unavailable" });
      } else {
        res.status(502).json({ error: "Coach returned content that could not be verified safe. Try again." });
      }
      return;
    }

    const retryZod = RefineSchema.safeParse(retryCall.data);
    if (!retryZod.success) {
      emitPromptEvent(req, "refine", false, startTs, traceId);
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      return;
    }

    const retryFiltered = filterOutput<Refine>(retryZod.data, "refine" as FilterMode);
    if (retryFiltered.reject) {
      emitPromptEvent(req, "refine", false, startTs, traceId);
      res.status(502).json({
        error: "Coach returned content that could not be verified safe. Try again.",
        flags: retryFiltered.flags,
      });
      return;
    }

    emitPromptEvent(req, "refine", true, startTs, traceId);
    res.status(200).json({
      result: retryFiltered.clean,
      flags: retryFiltered.flags,
    });
    return;
  }

  emitPromptEvent(req, "refine", true, startTs, traceId);
  res.status(200).json({
    result: filtered.clean,
    flags: filtered.flags,
  });
}

export async function handlePreview(
  req: express.Request,
  res: express.Response
): Promise<void> {
  const startTs = Date.now();
  const traceId = newTraceId();

  const parsed = PreviewBodySchema.safeParse(req.body);
  if (!parsed.success) {
    emitPromptEvent(req, "preview", false, startTs, traceId);
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request body" });
    return;
  }
  const { prompt } = parsed.data;

  const retrieval = retrieveContext(prompt);
  const systemPrompt = TEMPLATES.preview.replace(
    "{{retrieved_chapters}}",
    retrieval.formatted
  );

  const messages: CivicAiMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];
  const options: CivicAiOptions = {
    temperature: TEMPERATURES.preview,
    max_tokens: 600,
    response_format: { type: "json_object" },
    traceId,
  };

  // First attempt
  const p1Start = Date.now();
  let callResult = await callAndParse(messages, options);
  emitLlmCallEvent(req, "preview", callResult.ok, Date.now() - p1Start, traceId,
    callResult.ok ? undefined : { breaker_state: callResult.breakerOpen ? "open" : "closed" });

  if (!callResult.ok && callResult.breakerOpen) {
    emitPromptEvent(req, "preview", false, startTs, traceId, { breaker_state: "open" });
    res.status(503).json({ error: "Coach feedback temporarily unavailable" });
    return;
  }

  if (!callResult.ok) {
    const retryMessages: CivicAiMessage[] = [
      { role: "system", content: JSON_RETRY_PREFIX + systemPrompt },
      { role: "user", content: prompt },
    ];
    const p2Start = Date.now();
    callResult = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "preview", callResult.ok, Date.now() - p2Start, traceId,
      callResult.ok ? undefined : { breaker_state: callResult.breakerOpen ? "open" : "closed" });
  }

  if (!callResult.ok) {
    emitPromptEvent(req, "preview", false, startTs, traceId,
      callResult.breakerOpen ? { breaker_state: "open" } : undefined);
    if (callResult.breakerOpen) {
      res.status(503).json({ error: "Coach feedback temporarily unavailable" });
    } else {
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
    }
    return;
  }

  // Zod schema validation
  let validated: Preview;
  let zodResult = PreviewSchema.safeParse(callResult.data);

  if (!zodResult.success) {
    const retryMessages: CivicAiMessage[] = [
      { role: "system", content: JSON_RETRY_PREFIX + systemPrompt },
      { role: "user", content: prompt },
    ];
    const p3Start = Date.now();
    const retryCall = await callAndParse(retryMessages, options);
    emitLlmCallEvent(req, "preview", retryCall.ok, Date.now() - p3Start, traceId,
      retryCall.ok ? undefined : { breaker_state: retryCall.breakerOpen ? "open" : "closed" });
    if (!retryCall.ok) {
      emitPromptEvent(req, "preview", false, startTs, traceId,
        retryCall.breakerOpen ? { breaker_state: "open" } : undefined);
      if (retryCall.breakerOpen) {
        res.status(503).json({ error: "Coach feedback temporarily unavailable" });
      } else {
        res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      }
      return;
    }
    zodResult = PreviewSchema.safeParse(retryCall.data);
    if (!zodResult.success) {
      emitPromptEvent(req, "preview", false, startTs, traceId);
      res.status(502).json({ error: "Coach returned an invalid response. Try again." });
      return;
    }
  }

  validated = zodResult.data;

  // Output filter (preview: redact, never reject)
  const filtered = filterOutput<Preview>(validated, "preview" as FilterMode);

  emitPromptEvent(req, "preview", true, startTs, traceId);
  res.status(200).json({
    result: filtered.clean,
    flags: filtered.flags,
  });
}
