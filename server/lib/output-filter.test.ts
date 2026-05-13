/**
 * output-filter.test.ts
 *
 * strict_tdd foundation — Task #20.
 * Characterization tests for the existing filterOutput implementation.
 * Covers: 4 regex positive matches, 4 false-positive guards, per-mode contract.
 *
 * No globals — explicit vitest imports for tsconfig cleanliness.
 */
import { describe, it, expect } from "vitest";
import {
  filterOutput,
  type FilterMode,
  type FilterFlag,
  type FilterResult,
} from "./output-filter.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Collect unique pattern names from a flag array. */
function patternNames(flags: FilterFlag[]): string[] {
  return [...new Set(flags.map((f) => f.pattern))];
}

// ─── Positive matches (one per pattern) ──────────────────────────────────────

describe("FLORIDA_STATUTE_RE — positive matches", () => {
  it('flags "Fla. Stat. § 286.011" as florida_statute', () => {
    const result = filterOutput({ text: "See Fla. Stat. § 286.011 for details." }, "critique");
    expect(patternNames(result.flags)).toContain("florida_statute");
  });

  it('flags "F.S. 119.07" as florida_statute', () => {
    const result = filterOutput({ text: "Under F.S. 119.07 the record is public." }, "critique");
    expect(patternNames(result.flags)).toContain("florida_statute");
  });

  it("redacts the statute citation in clean output (critique mode)", () => {
    const result = filterOutput({ text: "See Fla. Stat. § 286.011 for details." }, "critique");
    expect((result.clean as { text: string }).text).toContain("[REDACTED:florida_statute]");
  });
});

describe("DOLLAR_AMOUNT_LARGE_RE — positive matches", () => {
  it('flags "$1.2M" as dollar_amount_large', () => {
    const result = filterOutput({ text: "The project costs $1.2M this year." }, "critique");
    expect(patternNames(result.flags)).toContain("dollar_amount_large");
  });

  it('flags "$500 million" as dollar_amount_large', () => {
    const result = filterOutput({ text: "Allocated $500 million in reserves." }, "preview");
    expect(patternNames(result.flags)).toContain("dollar_amount_large");
  });
});

describe("ORDINANCE_SECTION_RE — positive matches", () => {
  it('flags "Chapter 12.5" as ordinance_section', () => {
    const result = filterOutput({ text: "Per Chapter 12.5 of the code." }, "critique");
    expect(patternNames(result.flags)).toContain("ordinance_section");
  });

  it('flags "Section 47.3.2" as ordinance_section', () => {
    const result = filterOutput({ text: "Refer to Section 47.3.2 for the procedure." }, "preview");
    expect(patternNames(result.flags)).toContain("ordinance_section");
  });
});

describe("FY_BUDGET_YEAR_RE — positive matches", () => {
  it('flags "FY2025 budget" as fy_budget_year', () => {
    const result = filterOutput({ text: "The FY2025 budget allocation is pending." }, "critique");
    expect(patternNames(result.flags)).toContain("fy_budget_year");
  });

  it('flags "FY 25 appropriation" as fy_budget_year', () => {
    const result = filterOutput({ text: "See the FY 25 appropriation for line items." }, "preview");
    expect(patternNames(result.flags)).toContain("fy_budget_year");
  });
});

// ─── Critical false-positive guards ──────────────────────────────────────────

describe("false-positive guards", () => {
  it('"Chapter 13" (no decimal) does NOT match ordinance_section', () => {
    const result = filterOutput({ text: "This is covered in Chapter 13." }, "critique");
    expect(patternNames(result.flags)).not.toContain("ordinance_section");
  });

  it('"$50" (no magnitude suffix) does NOT match dollar_amount_large', () => {
    const result = filterOutput({ text: "The fee is $50." }, "critique");
    expect(patternNames(result.flags)).not.toContain("dollar_amount_large");
  });

  it('"FY2025" alone (no budget keyword) does NOT match fy_budget_year', () => {
    const result = filterOutput({ text: "The FY2025 report is ready." }, "critique");
    expect(patternNames(result.flags)).not.toContain("fy_budget_year");
  });

  it('"Section 286 of the chapter" (no Fla./F.S. prefix) does NOT match florida_statute', () => {
    const result = filterOutput({ text: "Refer to Section 286 of the chapter." }, "critique");
    expect(patternNames(result.flags)).not.toContain("florida_statute");
  });
});

// ─── Per-mode contract ────────────────────────────────────────────────────────

describe("per-mode behavior", () => {
  const STATUTE_INPUT = { suggestions: ["See Fla. Stat. § 286.011 for details."] };

  it("critique: redacts match, reject=false, flags populated", () => {
    const result = filterOutput(STATUTE_INPUT, "critique");
    expect(result.reject).toBe(false);
    expect(result.flags.length).toBeGreaterThan(0);
    expect((result.clean as typeof STATUTE_INPUT).suggestions[0]).toContain(
      "[REDACTED:florida_statute]"
    );
  });

  it("refine: clean equals original (no redaction), reject=true when flags fired", () => {
    const result = filterOutput(STATUTE_INPUT, "refine");
    expect(result.reject).toBe(true);
    // clean must be unchanged — no [REDACTED:...] marks
    expect((result.clean as typeof STATUTE_INPUT).suggestions[0]).toBe(
      "See Fla. Stat. § 286.011 for details."
    );
    expect((result.clean as typeof STATUTE_INPUT).suggestions[0]).not.toContain("[REDACTED:");
  });

  it("preview: redacts match, reject=false, flags populated", () => {
    const result = filterOutput(STATUTE_INPUT, "preview");
    expect(result.reject).toBe(false);
    expect(result.flags.length).toBeGreaterThan(0);
    expect((result.clean as typeof STATUTE_INPUT).suggestions[0]).toContain(
      "[REDACTED:florida_statute]"
    );
  });

  it("clean output with no flags: reject=false regardless of mode", () => {
    const clean_input = { text: "Write a clear, specific prompt for the task." };
    const resultCritique = filterOutput(clean_input, "critique");
    const resultRefine = filterOutput(clean_input, "refine");
    const resultPreview = filterOutput(clean_input, "preview");
    expect(resultCritique.reject).toBe(false);
    expect(resultRefine.reject).toBe(false);
    expect(resultPreview.reject).toBe(false);
    expect(resultCritique.flags).toHaveLength(0);
    expect(resultRefine.flags).toHaveLength(0);
    expect(resultPreview.flags).toHaveLength(0);
  });
});

// ─── Generic type-preservation smoke ─────────────────────────────────────────

describe("generic type preservation", () => {
  interface CritiqueLike {
    suggestions: string[];
    notes: string;
  }

  it("preserves typed shape through filterOutput generic — no cast needed on access", () => {
    const input: CritiqueLike = {
      suggestions: ["Good use of context. See Fla. Stat. § 286.011 if needed."],
      notes: "Prompt is clear.",
    };
    const result: FilterResult<CritiqueLike> = filterOutput(input, "critique");
    // Access typed fields without `as any` — proves the generic flows through.
    const firstSuggestion: string = result.clean.suggestions[0];
    const notes: string = result.clean.notes;
    expect(firstSuggestion).toContain("[REDACTED:florida_statute]");
    expect(notes).toBe("Prompt is clear.");
  });
});
