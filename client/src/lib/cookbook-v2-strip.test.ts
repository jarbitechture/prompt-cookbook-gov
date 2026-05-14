/**
 * cookbook-v2-strip.test.ts — Batch 1 strip-back (2026-05-14)
 *
 * Verifies the v2 strip-back per docs/cookbook-v2-spec-2026-05-14.md §5:
 *   T1 — Governance Registry source + numeric qualityScore removed
 *   T2 — Chapters 17/18/19/22 deleted
 *   T3 — stats export removed from cookbookData
 *
 * Strict TDD: tests written before edits; written to fail against pre-strip
 * cookbookData.ts.
 */
import { describe, it, expect } from "vitest";
import * as cookbookData from "./cookbookData";
import { chapters } from "./cookbookData";

describe("T1 — qualityScore cleanup", () => {
  it("no chapter has a numeric qualityScore (must be null)", () => {
    const numericChapters = chapters.filter(
      (c) => c.qualityScore !== null && typeof c.qualityScore === "number",
    );
    expect(numericChapters.map((c) => c.id)).toEqual([]);
  });

  it("Chapter type still exposes qualityScore: number | null (kept for future reinstatement)", () => {
    // Type-level check: a chapter literal with qualityScore: null is valid.
    // This will fail tsc if the field is dropped from the interface.
    const c = chapters[0];
    // Either null or undefined are acceptable post-strip states; numeric is not.
    expect(c.qualityScore === null || c.qualityScore === undefined).toBe(true);
  });
});

describe("T1 — Governance Registry source strings removed", () => {
  it("no chapter's source field contains 'Governance Registry'", () => {
    const offenders = chapters.filter((c) => /Governance Registry/i.test(c.source));
    expect(offenders.map((c) => `${c.id}: ${c.source}`)).toEqual([]);
  });
});

describe("T2 — ch17 / ch18 / ch19 / ch22 deleted", () => {
  it.each(["ch17", "ch18", "ch19", "ch22"])(
    "chapter %s is no longer in chapters[]",
    (id) => {
      expect(chapters.find((c) => c.id === id)).toBeUndefined();
    },
  );
});

describe("T3 — stats export removed", () => {
  it("cookbookData does not export `stats`", () => {
    // Runtime presence check; survives tsc even if `stats` re-appears.
    expect("stats" in cookbookData).toBe(false);
  });
});
