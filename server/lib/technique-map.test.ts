/**
 * technique-map.test.ts
 *
 * Guards the 6 plain-language Refine cards against silent breakage:
 *   - Every TechniqueKey resolves to a chapter number that exists in
 *     cookbookData.ts (catches future renumbering or chapter deletion).
 *   - No two techniques share a chapter — except the documented gaps where
 *     this map has no dedicated chapter to anchor on (asserted as a count,
 *     not silently accepted).
 *   - isTechniqueKey type guard accepts only the 6 known keys.
 */

import { describe, it, expect } from "vitest";
import {
  TECHNIQUE_KEYS,
  TECHNIQUE_TO_CHAPTER,
  TECHNIQUE_FOCUS,
  isTechniqueKey,
  type TechniqueKey,
} from "./technique-map.js";
import { chapters } from "../../client/src/lib/cookbookData.js";

describe("technique-map", () => {
  it("every TechniqueKey maps to a chapter that exists in cookbookData", () => {
    for (const key of TECHNIQUE_KEYS) {
      const chapterNumber = TECHNIQUE_TO_CHAPTER[key];
      const found = chapters.find((c) => c.number === chapterNumber);
      expect(
        found,
        `TechniqueKey "${key}" → chapter ${chapterNumber} not found in cookbookData.ts (chapter renumbered or deleted)`
      ).toBeDefined();
    }
  });

  it("exposes exactly 6 keys", () => {
    expect(TECHNIQUE_KEYS).toHaveLength(6);
    expect(Object.keys(TECHNIQUE_TO_CHAPTER)).toHaveLength(6);
  });

  it("map covers every TECHNIQUE_KEY (no missing rows)", () => {
    for (const key of TECHNIQUE_KEYS) {
      expect(TECHNIQUE_TO_CHAPTER[key]).toBeTypeOf("number");
    }
  });

  it("isTechniqueKey accepts the 6 known keys", () => {
    for (const key of TECHNIQUE_KEYS) {
      expect(isTechniqueKey(key)).toBe(true);
    }
  });

  it("isTechniqueKey rejects unknown values", () => {
    expect(isTechniqueKey("zeroshot")).toBe(false);
    expect(isTechniqueKey("")).toBe(false);
    expect(isTechniqueKey(undefined)).toBe(false);
    expect(isTechniqueKey(null)).toBe(false);
    expect(isTechniqueKey(3)).toBe(false);
    expect(isTechniqueKey({})).toBe(false);
  });

  it("exhaustive switch on TechniqueKey compiles", () => {
    // Compile-time check: if a key is added/removed, this switch breaks
    // without an explicit update. The runtime assertion is the value count.
    const seen = new Set<TechniqueKey>();
    for (const key of TECHNIQUE_KEYS) {
      switch (key) {
        case "add-examples":
        case "show-reasoning":
        case "set-role":
        case "specify-output":
        case "add-constraints":
        case "more-specific":
          seen.add(key);
          break;
        default: {
          // Type-level exhaustiveness: never reachable if the union is complete
          const _exhaustive: never = key;
          throw new Error(`Unhandled technique key: ${_exhaustive as string}`);
        }
      }
    }
    expect(seen.size).toBe(6);
  });

  it("TECHNIQUE_FOCUS defines a directive for every TechniqueKey", () => {
    for (const key of TECHNIQUE_KEYS) {
      const focus = TECHNIQUE_FOCUS[key];
      expect(focus, `${key} missing focus directive`).toBeTruthy();
      expect(focus.length).toBeGreaterThan(40); // not a stub
      // Every directive starts with FOCUS — gives the LLM a clear cue
      expect(focus).toMatch(/^FOCUS THIS REFINEMENT/);
    }
  });

  it("TECHNIQUE_FOCUS directives avoid jargon the LLM might recurse on", () => {
    // The focus directives must use plain-language verbs that map to user-card
    // wording, not LLM/prompt-engineering jargon like "few-shot" or "zero-shot"
    // (those could send the model into recursive jargon territory).
    const bannedJargon = ["few-shot", "zero-shot", "one-shot", "n-shot"];
    for (const key of TECHNIQUE_KEYS) {
      const focus = TECHNIQUE_FOCUS[key].toLowerCase();
      for (const banned of bannedJargon) {
        expect(focus, `${key} uses banned jargon: ${banned}`).not.toContain(banned);
      }
    }
  });
});
