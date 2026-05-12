/**
 * Deterministic keyword chapter retrieval for the cookbook backend.
 *
 * Scoring (per deduplicated query token, case-insensitive substring match):
 *   title       +10
 *   subtitle    + 5
 *   taskType    + 5  (optional field — skipped when absent)
 *   keyTakeaways+ 4
 *   summary     + 3
 *   content     + 2
 *
 * The scoring fields match `mcp/server.ts:searchChaptersImpl` (content +2,
 * keyTakeaways +4) extended with taskType +5 per ADR-003 acceptance criteria.
 * Tokenization diverges intentionally: per-token split instead of whole-query
 * `.includes()`, so multi-word queries ("draft a press release") match broader.
 * Ties broken by chapter number ascending for determinism.
 *
 * Cross-tree import from client/src/lib/ follows the same pattern as mcp/server.ts:32.
 */

import { chapters, type Chapter } from "../../client/src/lib/cookbookData.js";

const SCORE_THRESHOLD = 5;

/** Tokenize query: lowercase, split on whitespace, deduplicate. */
function tokenize(query: string): string[] {
  const raw = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return [...new Set(raw)];
}

/** Score a single chapter against a set of query tokens. */
function score(chapter: Chapter, tokens: string[]): number {
  let total = 0;
  for (const t of tokens) {
    if (chapter.title.toLowerCase().includes(t)) total += 10;
    if (chapter.subtitle.toLowerCase().includes(t)) total += 5;
    if (chapter.taskType && chapter.taskType.toLowerCase().includes(t)) total += 5;
    if (chapter.keyTakeaways.some((p) => p.toLowerCase().includes(t))) total += 4;
    if (chapter.summary.toLowerCase().includes(t)) total += 3;
    if (chapter.content.some((p) => p.toLowerCase().includes(t))) total += 2;
  }
  return total;
}

/** Build the markdown block injected into the {{retrieved_chapters}} placeholder. */
function formatContext(
  fullChapter: Chapter,
  summaries: { chapterNumber: number; title: string; summary: string }[]
): string {
  const lines: string[] = [];

  lines.push("## Top-matched chapter (full content)");
  lines.push(`### Chapter ${fullChapter.number}: ${fullChapter.title}`);
  lines.push("");
  lines.push(fullChapter.content.join("\n\n"));

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

  // Trim trailing blank lines
  return lines.join("\n").trimEnd();
}

// ─── public API ──────────────────────────────────────────────────────────────

export interface RetrievalResult {
  summaries: { chapterNumber: number; title: string; summary: string }[];
  fullChapter: Chapter | null;
  formatted: string;
}

/**
 * Retrieve the most relevant cookbook chapters for a given query.
 *
 * @param query  User's draft prompt or free-text query.
 * @param topN   Total chapters to consider (1 full + up to topN-1 summaries). Defaults to 3.
 */
export function retrieveContext(query: string, topN = 3): RetrievalResult {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return { summaries: [], fullChapter: null, formatted: "" };
  }

  const scored = chapters
    .map((c) => ({ chapter: c, s: score(c, tokens) }))
    .filter((x) => x.s >= SCORE_THRESHOLD)
    .sort((a, b) => b.s - a.s || a.chapter.number - b.chapter.number)
    .slice(0, topN);

  if (scored.length === 0) {
    return { summaries: [], fullChapter: null, formatted: "" };
  }

  const fullChapter = scored[0].chapter;
  const summaries = scored.slice(1).map((x) => ({
    chapterNumber: x.chapter.number,
    title: x.chapter.title,
    summary: x.chapter.summary,
  }));

  return {
    summaries,
    fullChapter,
    formatted: formatContext(fullChapter, summaries),
  };
}
