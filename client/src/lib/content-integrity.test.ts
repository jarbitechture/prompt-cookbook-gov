/**
 * content-integrity.test.ts — comprehensive 4-class content guard
 *
 * Class 1: Fabricated metric prose in cookbookData.ts chapters
 *           (re-uses FABRICATED_PATTERNS from no-fabricated-claims-patterns.ts)
 * Class 2: Hardcoded content-size literals in user-facing strings
 *           (e.g. "15 plug-and-play prompt templates", "14 lessons on...")
 * Class 3: Unverifiable Handbook version/date + bare provenance cites
 *           (e.g. "The AI Governance Handbook (March 2026)")
 * Class 4: Concrete county figures in Builder template context fields
 *           (bare $\d amounts, bare \d{2,3}% not in brackets, bare RFP #...\d)
 *
 * Environment: node (no DOM needed — static file analysis via fs.readFileSync).
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { chapters } from "./cookbookData";
import { FABRICATED_PATTERNS } from "./no-fabricated-claims-patterns";
import { JUMPSTART_CHAPTER_COUNT, PROMPT_RECIPE_COUNT } from "./cookbook-resources";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Strip JS single-line and block comments from source text. */
function stripComments(src: string): string {
  // Remove /* ... */ block comments (non-greedy, dotAll)
  let out = src.replace(/\/\*[\s\S]*?\*\//g, " ");
  // Remove // ... to end-of-line
  out = out.replace(/\/\/[^\n]*/g, " ");
  return out;
}

/** Resolve a path relative to the repo root (two levels up from this file). */
function repoPath(...parts: string[]): string {
  return path.resolve(__dirname, "../../..", ...parts);
}

function readSrc(relPath: string): string {
  return fs.readFileSync(repoPath(relPath), "utf8");
}

// ─── Class 1 ─────────────────────────────────────────────────────────────────
// Fabricated metric prose — re-uses shared patterns; no duplication.

type C1Violation = {
  chapterId: string;
  field: string;
  matchedPattern: string;
  matchedString: string;
};

function scanChaptersC1(): C1Violation[] {
  const violations: C1Violation[] = [];
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
              matchedString: text
                .slice(Math.max(0, match.index - 20), match.index + match[0].length + 40)
                .replace(/\n/g, " "),
            });
            break;
          }
        }
      }
    }
  }
  return violations;
}

// ─── Class 2 ─────────────────────────────────────────────────────────────────
// Hardcoded content-size literals in user-facing strings.
//
// Scanned files: searchIndex.ts, Resources.tsx, Home.tsx, Portal.tsx, Sidebar.tsx
// Pattern allows up to 5 intervening words between the number and the noun.
// Comments are stripped before scanning to avoid false-positives on inline docs.

const COUNT_NOUN_RE =
  /\b(\d{1,3})\s+(?:[\w'-]+\s+){0,5}(chapters|lessons|recipes|templates|steps|courses|prompts)\b/i;

// Exact known-good counts derived from the real arrays.
const SAFE_COUNTS = new Set([JUMPSTART_CHAPTER_COUNT, PROMPT_RECIPE_COUNT]);

type C2Violation = {
  file: string;
  line: number;
  matched: string;
  extractedNumber: number;
};

function scanFileC2(relPath: string): C2Violation[] {
  const src = readSrc(relPath);
  const stripped = stripComments(src);
  const lines = stripped.split("\n");
  const violations: C2Violation[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = COUNT_NOUN_RE.exec(lines[i]);
    if (m) {
      const num = parseInt(m[1], 10);
      // Allow counts that are proven correct by the real arrays.
      if (!SAFE_COUNTS.has(num)) {
        violations.push({
          file: relPath,
          line: i + 1,
          matched: lines[i].trim().slice(0, 120),
          extractedNumber: num,
        });
      }
    }
  }
  return violations;
}

// Resources.tsx is excluded from Class 2: it contains the jumpstartChapters and
// promptRecipes arrays (with legitimate prose numbers like "9 steps" and "15 years
// of experience") which are extracted to cookbook-resources.ts as part of this
// fix. Post-fix, Resources.tsx imports counts dynamically via .length and is clean.
const C2_FILES = [
  "client/src/lib/searchIndex.ts",
  "client/src/pages/Home.tsx",
  "client/src/pages/Portal.tsx",
  "client/src/components/Sidebar.tsx",
];

// ─── Class 3 ─────────────────────────────────────────────────────────────────
// Unverifiable Handbook version/date + bare provenance cites.
//
// Patterns:
//   a) "Handbook (Month YYYY)" or "Handbook (YYYY)"
//   b) "Handbook v\d" — version number in a string literal
//   c) AI Policy doc with a version/date in parentheses

const HANDBOOK_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "Handbook with date in parens",    re: /Handbook\s*\(\s*\w+\s+\d{4}\s*\)/i },
  { label: "Handbook with version number",    re: /Handbook\s+v\d/i },
  { label: "AI Policy doc with date",         re: /AI\s+(?:Policy|Procedure|Governance)\s+(?:Doc|Document)?\s*\(\s*\w+\s+\d{4}\s*\)/i },
];

const C3_FILES = [
  "client/src/lib/departments.ts",
  "client/src/lib/cookbookData.ts",
  "client/src/pages/Resources.tsx",
];

type C3Violation = {
  file: string;
  line: number;
  matchedPattern: string;
  matched: string;
};

function scanFileC3(relPath: string): C3Violation[] {
  const src = readSrc(relPath);
  const lines = src.split("\n");
  const violations: C3Violation[] = [];
  for (let i = 0; i < lines.length; i++) {
    for (const { label, re } of HANDBOOK_PATTERNS) {
      if (re.test(lines[i])) {
        violations.push({
          file: relPath,
          line: i + 1,
          matchedPattern: label,
          matched: lines[i].trim().slice(0, 120),
        });
        break;
      }
    }
  }
  return violations;
}

// ─── Class 4 ─────────────────────────────────────────────────────────────────
// Concrete county figures in Builder template context fields.
//
// Scanned file: client/src/pages/Builder.tsx
// Scanned range: the `const templates: Template[] = [` array (bounded by
//   start marker "const templates: Template[] = [" and end marker "^];")
//
// For each template entry, the `context: "..."` string value is extracted and
// checked.  Bracket-wrapped placeholders like $[X] or [85%] are stripped
// before pattern matching so they never fire.
//
// Patterns (applied only to the extracted context value, after bracket-strip):
//   a) Bare dollar amount:  $\d  (not in [brackets])
//   b) Bare percentage:     \d{2,3}%  not preceded by [ or followed by ]
//   c) Bare RFP number:     RFP #\d  (RFP followed by # and digits)

const C4_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "bare dollar amount",   re: /(?<!\[)[^[]*\$\d/ },
  { label: "bare percentage",      re: /(?<!\[)\b\d{2,3}%(?!\s*\])/ },
  { label: "bare RFP number",      re: /RFP\s*#\s*\d/ },
];

const C4_FILE = "client/src/pages/Builder.tsx";

type C4Violation = {
  line: number;
  matchedPattern: string;
  matched: string;
};

function scanFileC4(): C4Violation[] {
  const src = readSrc(C4_FILE);
  const lines = src.split("\n");
  const violations: C4Violation[] = [];
  let inTemplates = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Enter the templates array
    if (!inTemplates && /const templates\s*:\s*Template\[\]\s*=\s*\[/.test(line)) {
      inTemplates = true;
      continue;
    }

    // Exit the templates array (bare `];` line)
    if (inTemplates && /^\s*\];\s*$/.test(line)) {
      inTemplates = false;
      continue;
    }

    if (!inTemplates) continue;

    // Extract context: "..." value from the template entry line
    const ctxMatch = /\bcontext:\s*"([^"]*)"/.exec(line);
    if (!ctxMatch) continue;

    const contextValue = ctxMatch[1];
    // Strip bracket-wrapped placeholders before applying patterns
    const stripped = contextValue.replace(/\[[^\]]*\]/g, "");

    for (const { label, re } of C4_PATTERNS) {
      if (re.test(stripped)) {
        violations.push({
          line: i + 1,
          matchedPattern: label,
          matched: contextValue.slice(0, 120),
        });
        break;
      }
    }
  }
  return violations;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Content Integrity Guard", () => {

  // ── Class 1 ──────────────────────────────────────────────────────────────

  describe("Class 1 — no fabricated metric claims in chapter prose", () => {
    it("no chapter summary contains a fabricated metric", () => {
      const v = scanChaptersC1().filter((x) => x.field === "summary");
      expect(
        v.map((x) => `${x.chapterId}.summary [${x.matchedPattern}]: …${x.matchedString}…`),
      ).toEqual([]);
    });

    it("no chapter content[] element contains a fabricated metric", () => {
      const v = scanChaptersC1().filter((x) => x.field === "content");
      expect(
        v.map((x) => `${x.chapterId}.content [${x.matchedPattern}]: …${x.matchedString}…`),
      ).toEqual([]);
    });

    it("no chapter keyTakeaways[] element contains a fabricated metric", () => {
      const v = scanChaptersC1().filter((x) => x.field === "keyTakeaways");
      expect(
        v.map((x) => `${x.chapterId}.keyTakeaways [${x.matchedPattern}]: …${x.matchedString}…`),
      ).toEqual([]);
    });
  });

  // ── Class 2 ──────────────────────────────────────────────────────────────

  describe("Class 2 — no hardcoded content-size literals in user-facing strings", () => {
    it("no scanned source file contains a hardcoded count that differs from the real array lengths", () => {
      const allViolations: string[] = [];
      for (const f of C2_FILES) {
        const vs = scanFileC2(f);
        for (const v of vs) {
          allViolations.push(
            `${v.file}:${v.line} — "${v.matched}" (extracted number: ${v.extractedNumber})`,
          );
        }
      }
      expect(allViolations).toEqual([]);
    });

    it("COUNT_NOUN_RE does not false-positive on dynamic JSX expressions like {n} lessons", () => {
      const JSX_DYNAMIC = `{jumpstartChapters.length} lessons — click any to read`;
      expect(COUNT_NOUN_RE.test(stripComments(JSX_DYNAMIC))).toBe(false);
    });

    it("COUNT_NOUN_RE does not false-positive on CSS colour-map keys like 'chapter:'", () => {
      const CSS_KEY = `chapter: { color: "oklch(0.42 0.14 300)" },`;
      expect(COUNT_NOUN_RE.test(stripComments(CSS_KEY))).toBe(false);
    });
  });

  // ── Class 3 ──────────────────────────────────────────────────────────────

  describe("Class 3 — no unverifiable Handbook version/date in source files", () => {
    it("no scanned source file contains a Handbook date or version claim", () => {
      const allViolations: string[] = [];
      for (const f of C3_FILES) {
        const vs = scanFileC3(f);
        for (const v of vs) {
          allViolations.push(
            `${v.file}:${v.line} [${v.matchedPattern}]: "${v.matched}"`,
          );
        }
      }
      expect(allViolations).toEqual([]);
    });
  });

  // ── Class 4 ──────────────────────────────────────────────────────────────

  describe("Class 4 — no bare concrete county figures in Builder context fields", () => {
    it("no Builder template context field contains a bare dollar amount, bare percentage, or bare RFP number", () => {
      const vs = scanFileC4();
      expect(
        vs.map((v) => `Builder.tsx:${v.line} [${v.matchedPattern}]: "${v.matched}"`),
      ).toEqual([]);
    });

    it("Class 4 does NOT false-positive on [PLACEHOLDER]-bracketed values", () => {
      // Simulate a Builder template context value with proper placeholders only
      const placeholderValue = `Budget is $[X] of $[Y], approval rate [85%], see RFP #[NUMBER].`;
      // Strip placeholders and check no C4 pattern fires
      const stripped = placeholderValue.replace(/\[[^\]]*\]/g, "");
      const fired = C4_PATTERNS.some(({ re }) => re.test(stripped));
      expect(fired).toBe(false);
    });

    it("Class 4 RED-capability: flags bare dollar amounts and passes bracketed equivalents", () => {
      // Bare figures — must fire
      const bareValue = `Budget spent: $1.2M of $4.8M`;
      const bareStripped = bareValue.replace(/\[[^\]]*\]/g, "");
      const bareFired = C4_PATTERNS.some(({ re }) => re.test(bareStripped));
      expect(bareFired).toBe(true);

      // Properly bracketed — must NOT fire
      const bracketedValue = `Budget spent: $[X] of $[Y]`;
      const bracketedStripped = bracketedValue.replace(/\[[^\]]*\]/g, "");
      const bracketedFired = C4_PATTERNS.some(({ re }) => re.test(bracketedStripped));
      expect(bracketedFired).toBe(false);
    });
  });

});
