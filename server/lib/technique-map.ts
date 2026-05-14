/**
 * technique-map.ts
 *
 * Maps the 6 plain-language Refine technique cards (UI side) to:
 *   1. A single chapter number for RAG retrieval (server side)
 *   2. A focus directive injected into the refine system prompt so the
 *      LLM knows the user's specific intent, not just the chapter context
 *
 * The endpoint accepts `chapter_id: number` and looks it up via
 * `chapters.find(c => c.number === chapter_id)`. This map produces that
 * number, plus a one-line directive that tells the LLM exactly what to do.
 *
 * Chapter selections (v2 strip-back left no dedicated Few-Shot / Output-
 * Format / Specificity chapters, so the picks below are the strongest
 * surviving teachers of each technique, NOT placeholders):
 *
 *   add-examples    → ch3  Email Tone Adjuster (input/output example pair —
 *                          the canonical few-shot pattern in template form)
 *   show-reasoning  → ch23 Chain-of-Thought Prompting (direct match)
 *   set-role        → ch25 Persona & Scenario Prompting (direct match)
 *   specify-output  → ch6  Status Update Formatter (output-format-focused
 *                          template — the chapter's entire purpose is
 *                          enforcing structured output)
 *   add-constraints → ch27 Negative Prompting (direct match)
 *   more-specific   → ch24 The RTCO Framework (RTCO IS the specificity
 *                          tool — Role + Task + Context + Output each add
 *                          specificity)
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

/**
 * User-intent directive injected into the refine system prompt.
 *
 * Without this, the LLM only sees the pinned chapter content and is left
 * to infer which of 6 refinement angles the user clicked. With this, the
 * LLM gets explicit instruction matched to the user's card choice.
 *
 * Format: a single imperative sentence the LLM can act on. Avoid jargon
 * the LLM might recurse on (e.g., "few-shot" instead of "examples").
 */
export const TECHNIQUE_FOCUS: Record<TechniqueKey, string> = {
  "add-examples":
    "FOCUS THIS REFINEMENT ON ADDING EXAMPLES. Show the AI 1-2 concrete input/output example pairs within the Context block of the rewritten prompt. Each example should demonstrate the format and quality the user wants.",
  "show-reasoning":
    "FOCUS THIS REFINEMENT ON STEP-BY-STEP REASONING. Add an instruction like 'Think through this step-by-step before giving your final answer' to the rewritten prompt. The goal is to have the AI show its work.",
  "set-role":
    "FOCUS THIS REFINEMENT ON SETTING THE ROLE. Add or strengthen a 'You are a [specific role at Manatee County]' opening. Make the role concrete and relevant to the task (e.g., 'You are a county budget analyst with 10 years of public-sector experience').",
  "specify-output":
    "FOCUS THIS REFINEMENT ON OUTPUT SPECIFICATION. Add explicit format, length, and tone constraints to the Output section of the rewritten prompt. Examples: 'Format as a 3-column markdown table', 'Maximum 200 words', 'Plain English, no jargon, 8th-grade reading level'.",
  "add-constraints":
    "FOCUS THIS REFINEMENT ON CONSTRAINTS. Add a 'Do NOT...' clause covering common failure modes: do not speculate, do not invent statistics, do not cite sources not in the prompt, do not use jargon without defining it, do not exceed [N] words.",
  "more-specific":
    "FOCUS THIS REFINEMENT ON SPECIFICITY. Replace vague language with concrete, measurable criteria. Vague terms like 'help', 'good', 'professional', 'soon', 'a lot', 'some' must be replaced with specific values (e.g., 'good' → '8th-grade reading level, AP style, under 200 words').",
};

export function isTechniqueKey(value: unknown): value is TechniqueKey {
  return (
    typeof value === "string" &&
    (TECHNIQUE_KEYS as readonly string[]).includes(value)
  );
}
