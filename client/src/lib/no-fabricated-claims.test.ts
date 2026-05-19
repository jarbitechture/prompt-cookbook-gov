/**
 * no-fabricated-claims.test.ts — T-R1 guard (2026-05-18)
 *
 * Scans every chapter's user-facing prose fields for fabricated metric claims
 * (quality scores, pass rates, dimension rubrics, "production-tested" badges).
 *
 * Written RED-first: must FAIL before cookbookData.ts is cleaned.
 */
import { describe, it, expect } from "vitest";
import { chapters } from "./cookbookData";

const FABRICATED_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "quality score mention",         re: /quality score/i },
  { label: "X/10 numeric score",            re: /\b\d(?:\.\d+)?\s*\/\s*10\b/ },
  { label: "percent pass rate claim",       re: /\b\d{2,3}\s*%\s*(?:test\s*)?pass rate/i },
  { label: "accuracy score label",          re: /accuracy score\s*:/i },
  { label: "dimension rubric claim",        re: /\d+-dimension rubric/i },
  { label: "production-tested badge",       re: /production-tested/i },
];

type Violation = {
  chapterId: string;
  field: string;
  matchedPattern: string;
  matchedString: string;
};

function scanChapters(): Violation[] {
  const violations: Violation[] = [];

  for (const chapter of chapters) {
    const probeFields: { field: string; texts: string[] }[] = [
      { field: "summary",      texts: [chapter.summary] },
      { field: "content",      texts: chapter.content },
      { field: "keyTakeaways", texts: chapter.keyTakeaways },
    ];

    for (const { field, texts } of probeFields) {
      for (const text of texts) {
        for (const { label, re } of FABRICATED_PATTERNS) {
          const match = re.exec(text);
          if (match) {
            violations.push({
              chapterId: chapter.id,
              field,
              matchedPattern: label,
              matchedString: text.slice(
                Math.max(0, match.index - 20),
                match.index + match[0].length + 40,
              ).replace(/\n/g, " "),
            });
            // One violation per (field-text, pattern) pair is enough.
            break;
          }
        }
      }
    }
  }

  return violations;
}

describe("T-R1 — no fabricated metric claims in prose", () => {
  it("no chapter summary contains a fabricated metric", () => {
    const violations = scanChapters().filter((v) => v.field === "summary");
    expect(
      violations.map((v) => `${v.chapterId}.summary [${v.matchedPattern}]: …${v.matchedString}…`),
    ).toEqual([]);
  });

  it("no chapter content[] element contains a fabricated metric", () => {
    const violations = scanChapters().filter((v) => v.field === "content");
    expect(
      violations.map((v) => `${v.chapterId}.content [${v.matchedPattern}]: …${v.matchedString}…`),
    ).toEqual([]);
  });

  it("no chapter keyTakeaways[] element contains a fabricated metric", () => {
    const violations = scanChapters().filter((v) => v.field === "keyTakeaways");
    expect(
      violations.map((v) => `${v.chapterId}.keyTakeaways [${v.matchedPattern}]: …${v.matchedString}…`),
    ).toEqual([]);
  });
});
