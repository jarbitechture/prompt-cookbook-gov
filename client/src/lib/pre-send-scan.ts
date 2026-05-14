/**
 * pre-send-scan.ts — P0-A demo-block patch (2026-05-14)
 *
 * Client-side PII pre-flight scanner. Runs synchronously before the
 * clipboard handoff in `sendToTarget()`. Pure regex; no DOM, no fetch.
 *
 * Why client-side: the assembled prompt never leaves the browser until
 * the user pastes it into Copilot / ChatGPT Enterprise — there is no
 * server round-trip to attach a scan to. Doing this in the browser
 * keeps the prompt body off the wire.
 *
 * Why a separate scanner from `server/lib/output-filter.ts`:
 *   - output-filter exists to catch LLM HALLUCINATIONS in critique /
 *     refine / preview RESPONSES (statute citations, large $ amounts,
 *     ordinance sections, FY budgets).
 *   - pre-send-scan exists to catch USER-PROVIDED PII before the
 *     clipboard write (SSN, phone, email, credit card, large $).
 *   These are different concerns with different precision/recall
 *   tradeoffs and different downstream consumers. The DOLLAR pattern
 *   is duplicated by intent — if output-filter's regex shifts to
 *   tune hallucination detection, pre-send-scan should not move with
 *   it automatically. Both files should be reviewed together when
 *   either pattern changes. See output-filter.ts:DOLLAR_AMOUNT_LARGE_RE.
 */

// ─── Pattern definitions ──────────────────────────────────────────────────────

/** Standard US SSN — `nnn-nn-nnnn`. Dashes required to keep noise low. */
const SSN_RE = /\b\d{3}-\d{2}-\d{4}\b/g;

/**
 * US phone number with separators. Accepts:
 *   - 941-555-1234, 941.555.1234, 941 555 1234
 *   - (941) 555-1234, (941)555-1234
 *   - +1 941-555-1234, 1-941-555-1234
 *
 * Bare 10-digit runs without ANY separator are intentionally NOT
 * matched — too ambiguous with order IDs / account numbers.
 */
const US_PHONE_RE =
  /(?:\+?1[-.\s]?)?(?:\(\d{3}\)\s*|\d{3}[-.\s])\d{3}[-.\s]\d{4}\b/g;

/**
 * Standard email pattern — local@domain.tld. Conservative on the
 * local-part character class to avoid eating adjacent punctuation.
 */
const EMAIL_RE = /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g;

/** 16-digit credit-card number with optional `-` or ` ` separators. */
const CREDIT_CARD_RE = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;

/**
 * Large/qualified dollar amounts: "$1.2M", "$500 million", "$3.5B".
 * Mirrors the server-side hallucination filter shape — see header
 * comment for the intentional duplication rationale.
 */
const DOLLAR_LARGE_RE =
  /\$\s*\d+(?:[,.]\d+)*\s*(?:M|million|B|billion|K|thousand)\b/gi;

// ─── Public type ──────────────────────────────────────────────────────────────

export type PiiPattern =
  | "ssn"
  | "us_phone"
  | "email"
  | "credit_card"
  | "dollar_amount_large";

export interface ScanMatch {
  /** Pattern name — narrow enum so server route can `.strict()` validate. */
  pattern: PiiPattern;
  /** Verbatim matched text. UI may truncate before display. */
  sample: string;
}

export interface ScanResult {
  /** True iff at least one pattern matched. */
  flagged: boolean;
  /** All matches across all patterns (one entry per match, not per pattern). */
  matches: ScanMatch[];
  /**
   * The input with every match replaced by `[REDACTED:<pattern>]`.
   * Identical case+format to server/lib/output-filter.ts redactions so
   * the audit experience reads as one consistent system.
   */
  redacted: string;
}

// ─── Internal table ───────────────────────────────────────────────────────────

const PATTERNS: ReadonlyArray<{ name: PiiPattern; re: RegExp }> = [
  { name: "ssn",                  re: SSN_RE },
  { name: "us_phone",             re: US_PHONE_RE },
  { name: "email",                re: EMAIL_RE },
  { name: "credit_card",          re: CREDIT_CARD_RE },
  { name: "dollar_amount_large",  re: DOLLAR_LARGE_RE },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Scan `prompt` for PII patterns. Pure function — no side effects.
 *
 * Module-level RegExp objects with /g carry mutable `lastIndex`
 * state. Each call resets `lastIndex = 0` before use. Safe under the
 * browser's single-threaded event loop because matchAll + replace
 * complete atomically within one synchronous tick.
 */
export function scanForPii(prompt: string): ScanResult {
  if (prompt.length === 0) {
    return { flagged: false, matches: [], redacted: "" };
  }

  const matches: ScanMatch[] = [];
  let redacted = prompt;

  for (const { name, re } of PATTERNS) {
    re.lastIndex = 0;
    const found = [...prompt.matchAll(re)];
    for (const m of found) {
      matches.push({ pattern: name, sample: m[0] });
    }
    if (found.length > 0) {
      re.lastIndex = 0;
      redacted = redacted.replace(re, `[REDACTED:${name}]`);
    }
  }

  return {
    flagged: matches.length > 0,
    matches,
    redacted,
  };
}
