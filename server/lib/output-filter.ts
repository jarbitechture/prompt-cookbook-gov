/**
 * output-filter.ts
 *
 * Layer 4 of the hallucination-zero defense: regex post-filter over LLM output.
 * Scans prose string fields for county-fact hallucination patterns.
 * Called after zod schema validation in every LLM endpoint.
 */

// Florida statute citation: "Fla. Stat. § 286.011", "F.S. 119.07", "FS §286.011(1)"
// Known quirk: when input is "F.S.A. §286.011(1)" the match truncates to
// "F.S.A. §286.011" because the trailing \b prefers the word boundary
// between "1" and "(" over the boundary after ")". The hallucination is
// still flagged and redacted; a dangling ")" appears in the redacted
// output. Cosmetic only — does not affect detection.
const FLORIDA_STATUTE_RE =
  /\b(?:Fla\.?\s*Stat\.?|F\.?S\.?A?\.?)\s*§?\s*\d+(?:\.\d+)?(?:\([a-z0-9]+\))?\b/gi;

// Large/qualified dollar amounts: "$1.2M", "$500 million", "$3.5B", "$200K"
// Intentionally excludes routine amounts like "$50" or "$1,250" to avoid over-blocking.
const DOLLAR_AMOUNT_LARGE_RE =
  /\$\s*\d+(?:[,.]\d+)*\s*(?:M|million|B|billion|K|thousand)\b/gi;

// Ordinance/code-section citations using decimal format: "Chapter 12.5", "Section 47.3.2", "Ord. 8.1"
// The \d+\.\d+ requirement means "Chapter 13" (cookbook ref, no decimal) is safe.
const ORDINANCE_SECTION_RE =
  /\b(?:Chapter|Section|Ord\.?)\s+\d+\.\d+(?:\.\d+)?\b/gi;

// FY budget references: "FY2025 budget", "FY 25 appropriation"
// Plain "FY2025" without a budget keyword is NOT flagged.
const FY_BUDGET_YEAR_RE =
  /\bFY\s*(?:20\d{2}|\d{2})\s+(?:budget|appropriation|allocation|fund)\b/gi;

// Module-level RegExp objects with /g flag carry mutable lastIndex
// state. The walker resets lastIndex = 0 before each use. Safe under
// Node's single-threaded event loop because matchAll + replace
// complete atomically within one synchronous scan.
const PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: "florida_statute", re: FLORIDA_STATUTE_RE },
  { name: "dollar_amount_large", re: DOLLAR_AMOUNT_LARGE_RE },
  { name: "ordinance_section", re: ORDINANCE_SECTION_RE },
  { name: "fy_budget_year", re: FY_BUDGET_YEAR_RE },
];

// ─── Public types ────────────────────────────────────────────────────────────

export type FilterMode = "critique" | "refine" | "preview";

export interface FilterFlag {
  /** Human-readable pattern label, e.g. "florida_statute" */
  pattern: string;
  /** Literal matched text as it appeared in the source string */
  match: string;
  /** JSON field path that contained the match, e.g. "suggestions[2]" */
  field: string;
}

export interface FilterResult<T> {
  /** Sanitized copy of the input; redacted for critique/preview, unchanged for refine */
  clean: T;
  /** All matches found across all string fields */
  flags: FilterFlag[];
  /** true only when mode === "refine" and at least one flag fired */
  reject: boolean;
}

// ─── Internal walker ─────────────────────────────────────────────────────────

/**
 * Recursively walks a plain-object tree. For every string leaf:
 *   - runs all 4 patterns and collects FilterFlag entries
 *   - optionally replaces match text with [REDACTED:name] when redact=true
 * Returns a new (cloned) node — never mutates input.
 */
function walkAndFilter(
  node: unknown,
  path: string,
  flags: FilterFlag[],
  redact: boolean
): unknown {
  if (typeof node === "string") {
    let result = node;
    for (const { name, re } of PATTERNS) {
      // Reset lastIndex because RegExp objects with /g are stateful.
      re.lastIndex = 0;
      const matches = [...node.matchAll(re)];
      for (const m of matches) {
        flags.push({ pattern: name, match: m[0], field: path });
      }
      if (redact && matches.length > 0) {
        re.lastIndex = 0;
        result = result.replace(re, `[REDACTED:${name}]`);
      }
    }
    return result;
  }

  if (Array.isArray(node)) {
    return node.map((item, i) =>
      walkAndFilter(item, `${path}[${i}]`, flags, redact)
    );
  }

  if (node !== null && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const childPath = path ? `${path}.${key}` : key;
      out[key] = walkAndFilter(value, childPath, flags, redact);
    }
    return out;
  }

  // Primitives (number, boolean, null, undefined) pass through untouched.
  return node;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Scan all string fields of `input` for hallucination markers.
 *
 * - critique / preview: redact matches in `clean`, reject=false
 * - refine: leave `clean` unchanged, reject=true if any flags fired
 *
 * Pure function — does not mutate `input`.
 */
export function filterOutput<T>(input: T, mode: FilterMode): FilterResult<T> {
  const flags: FilterFlag[] = [];
  // Redact for critique and preview; leave alone for refine.
  const redact = mode !== "refine";
  // path is the empty string at the root; first-level keys render as
  // bare names (e.g., "suggestions[2]" not ".suggestions[2]").
  const clean = walkAndFilter(
    structuredClone(input),
    "",
    flags,
    redact
  ) as T;

  return {
    clean,
    flags,
    reject: mode === "refine" && flags.length > 0,
  };
}
