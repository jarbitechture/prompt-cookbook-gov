/**
 * no-fabricated-claims-patterns.ts
 *
 * Single source of truth for fabricated-metric detection patterns.
 * Shared between no-fabricated-claims.test.ts (T-R1) and
 * content-integrity.test.ts (Class 1).
 */

export const FABRICATED_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "quality score mention",         re: /quality score/i },
  // Matches "9/10" or "9.6/10" but NOT "9/10/2026" (date) — the (?!\s*\/) lookahead
  // ensures the 10 is not followed by another slash (as in M/D/YYYY or fraction chains).
  { label: "X/10 numeric score",            re: /\b\d(?:\.\d+)?\s*\/\s*10\b(?!\s*\/)/ },
  { label: "percent pass rate claim",       re: /\b\d{2,3}\s*%\s*(?:test\s*)?pass rate/i },
  { label: "accuracy score label",          re: /accuracy score\s*:/i },
  { label: "dimension rubric claim",        re: /\d+-dimension rubric/i },
  { label: "production-tested badge",       re: /production-tested/i },
];
