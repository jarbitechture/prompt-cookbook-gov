/**
 * pre-send-scan.test.ts — P0-A demo-block patch (2026-05-14)
 *
 * Verifies the client-side PII pre-flight scanner that runs BEFORE the
 * clipboard handoff in sendToTarget(). Pure regex; no DOM, no fetch.
 *
 * Strict TDD: each failing assertion drives one regex behaviour.
 */
import { describe, it, expect } from "vitest";
import { scanForPii } from "./pre-send-scan";

// ─── SSN ───────────────────────────────────────────────────────────────────────

describe("scanForPii — SSN", () => {
  it("flags a typical SSN", () => {
    const r = scanForPii("My SSN is 123-45-6789 please redact");
    expect(r.flagged).toBe(true);
    expect(r.matches.some((m) => m.pattern === "ssn")).toBe(true);
  });

  it("redacts the SSN in place", () => {
    const r = scanForPii("My SSN is 123-45-6789 please redact");
    expect(r.redacted).toContain("[REDACTED:ssn]");
    expect(r.redacted).not.toContain("123-45-6789");
    // Surrounding text preserved.
    expect(r.redacted).toContain("My SSN is");
    expect(r.redacted).toContain("please redact");
  });

  it("does not match a 9-digit run without dashes", () => {
    // SSN_RE intentionally requires the dashes; bare 9-digit runs are
    // too ambiguous (zip+4, internal IDs, etc.) and would over-block.
    const r = scanForPii("Internal ID 123456789 reference");
    expect(r.matches.some((m) => m.pattern === "ssn")).toBe(false);
  });
});

// ─── US phone ──────────────────────────────────────────────────────────────────

describe("scanForPii — US phone", () => {
  it("flags 941-555-1234", () => {
    const r = scanForPii("call me at 941-555-1234 tomorrow");
    expect(r.flagged).toBe(true);
    expect(r.matches.some((m) => m.pattern === "us_phone")).toBe(true);
  });

  it("flags parenthesized form (941) 555-1234", () => {
    const r = scanForPii("call me at (941) 555-1234 tomorrow");
    expect(r.matches.some((m) => m.pattern === "us_phone")).toBe(true);
  });

  it("flags +1 941.555.1234", () => {
    const r = scanForPii("contact +1 941.555.1234 today");
    expect(r.matches.some((m) => m.pattern === "us_phone")).toBe(true);
  });

  it("does not flag a 10-digit run with no separators (false-positive guard)", () => {
    // A bare 10-digit run like an account or order number must not
    // trigger us_phone — it's too noisy. Real phone numbers are
    // formatted with separators virtually all the time in prose.
    const r = scanForPii("order id 1234567890 was shipped");
    expect(r.matches.some((m) => m.pattern === "us_phone")).toBe(false);
  });

  it("redacts the phone number in place", () => {
    const r = scanForPii("call me at 941-555-1234 tomorrow");
    expect(r.redacted).toContain("[REDACTED:us_phone]");
    expect(r.redacted).not.toContain("941-555-1234");
  });
});

// ─── Email ─────────────────────────────────────────────────────────────────────

describe("scanForPii — email", () => {
  it("flags a typical email", () => {
    const r = scanForPii("contact maya.rodriguez@example.com for details");
    expect(r.flagged).toBe(true);
    expect(r.matches.some((m) => m.pattern === "email")).toBe(true);
  });

  it("redacts the email in place", () => {
    const r = scanForPii("contact maya.rodriguez@example.com for details");
    expect(r.redacted).toContain("[REDACTED:email]");
    expect(r.redacted).not.toContain("maya.rodriguez@example.com");
  });
});

// ─── Credit card ───────────────────────────────────────────────────────────────

describe("scanForPii — credit card", () => {
  it("flags a 16-digit grouped card number", () => {
    const r = scanForPii("paid with 4111-1111-1111-1111 on file");
    expect(r.flagged).toBe(true);
    expect(r.matches.some((m) => m.pattern === "credit_card")).toBe(true);
  });

  it("flags a card with spaces", () => {
    const r = scanForPii("card 4111 1111 1111 1111 expired");
    expect(r.matches.some((m) => m.pattern === "credit_card")).toBe(true);
  });

  it("redacts the card", () => {
    const r = scanForPii("paid with 4111-1111-1111-1111 on file");
    expect(r.redacted).toContain("[REDACTED:credit_card]");
    expect(r.redacted).not.toContain("4111-1111-1111-1111");
  });
});

// ─── Large dollar amounts ──────────────────────────────────────────────────────

describe("scanForPii — dollar_amount_large", () => {
  it("flags '$3.2M'", () => {
    const r = scanForPii("FY2025 Parks budget shortfall of $3.2M reported");
    expect(r.matches.some((m) => m.pattern === "dollar_amount_large")).toBe(true);
  });

  it("flags '$500 million'", () => {
    const r = scanForPii("$500 million bond approved");
    expect(r.matches.some((m) => m.pattern === "dollar_amount_large")).toBe(true);
  });

  it("does NOT flag a routine '$50' amount (false-positive guard)", () => {
    // Matches the server-side output-filter behaviour — routine
    // amounts must pass clean to avoid over-blocking.
    const r = scanForPii("permit fee is $50");
    expect(r.matches.some((m) => m.pattern === "dollar_amount_large")).toBe(false);
  });

  it("does NOT flag '$1,250'", () => {
    const r = scanForPii("invoice total $1,250 due net 30");
    expect(r.matches.some((m) => m.pattern === "dollar_amount_large")).toBe(false);
  });
});

// ─── Multi-pattern + clean cases ───────────────────────────────────────────────

describe("scanForPii — combined", () => {
  it("returns flagged=true and multiple matches when several PII types co-occur", () => {
    const r = scanForPii(
      "Draft a letter to maya@example.com at 941-555-1234, SSN 123-45-6789."
    );
    expect(r.flagged).toBe(true);
    const patterns = new Set(r.matches.map((m) => m.pattern));
    expect(patterns.has("email")).toBe(true);
    expect(patterns.has("us_phone")).toBe(true);
    expect(patterns.has("ssn")).toBe(true);
  });

  it("returns flagged=false and unchanged redacted for a clean prompt", () => {
    const clean = "Summarize the agenda for Tuesday's commission meeting.";
    const r = scanForPii(clean);
    expect(r.flagged).toBe(false);
    expect(r.matches).toHaveLength(0);
    expect(r.redacted).toBe(clean);
  });

  it("returns flagged=false for empty input", () => {
    const r = scanForPii("");
    expect(r.flagged).toBe(false);
    expect(r.matches).toHaveLength(0);
    expect(r.redacted).toBe("");
  });

  it("includes a `sample` for each match for the warning modal (not the raw match)", () => {
    // We pass the literal match through `sample` so the modal can
    // render "We detected: SSN like 123-45-6789". The modal can
    // choose to truncate; the scanner just supplies the source text.
    const r = scanForPii("SSN 123-45-6789 present");
    const ssnMatch = r.matches.find((m) => m.pattern === "ssn");
    expect(ssnMatch).toBeDefined();
    expect(ssnMatch?.sample).toContain("123-45-6789");
  });
});
