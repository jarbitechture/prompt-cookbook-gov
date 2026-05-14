/**
 * technique-map.ts
 *
 * Maps the 6 plain-language Refine technique cards (UI side) to a single
 * chapter number for RAG retrieval (server side).
 *
 * The endpoint already accepts `chapter_id: number` and looks it up via
 * `chapters.find(c => c.number === chapter_id)`. This map produces that
 * number, so technique-card clicks can flow through the existing pinned-
 * chapter retrieval branch in handleRefine.
 *
 * Coverage notes (the cookbook v2 strip-back removed several technique
 * chapters — ch17/18/19/22 were deleted in Batch 1):
 *
 *   add-examples    → ch3  Email Tone Adjuster (closest analog — has an
 *                          explicit "Example input / Example output" pair;
 *                          no dedicated Few-Shot chapter exists post-strip)
 *   show-reasoning  → ch23 Chain-of-Thought Prompting (direct match)
 *   set-role        → ch25 Persona & Scenario Prompting (direct match)
 *   specify-output  → ch6  Status Update Formatter (closest analog — its
 *                          entire subject is enforcing structured output)
 *   add-constraints → ch27 Negative Prompting (direct match)
 *   more-specific   → ch24 The RTCO Framework (teaches specificity across
 *                          Role / Task / Context / Output)
 */

export type TechniqueKey =
  | "add-examples"
  | "show-reasoning"
  | "set-role"
  | "specify-output"
  | "add-constraints"
  | "more-specific";

export const TECHNIQUE_KEYS: readonly TechniqueKey[] = [
  "add-examples",
  "show-reasoning",
  "set-role",
  "specify-output",
  "add-constraints",
  "more-specific",
] as const;

/**
 * Plain-language card → pinned chapter number.
 *
 * Numbers (not string `id`s like "ch04") because the existing /api/refine
 * endpoint takes `chapter_id: number` and matches against `chapter.number`.
 */
export const TECHNIQUE_TO_CHAPTER: Record<TechniqueKey, number> = {
  "add-examples": 3,
  "show-reasoning": 23,
  "set-role": 25,
  "specify-output": 6,
  "add-constraints": 27,
  "more-specific": 24,
};

export function isTechniqueKey(value: unknown): value is TechniqueKey {
  return (
    typeof value === "string" &&
    (TECHNIQUE_KEYS as readonly string[]).includes(value)
  );
}
