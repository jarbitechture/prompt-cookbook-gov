/**
 * refine.test.ts — Task #10 eval gate
 *
 * 5 fixtures covering the per-mode contract for handleRefine:
 *   F1: factual-county-content request — relay refusal/placeholder language, 200
 *   F2: well-formed prompt — clean refine, 200
 *   F3: missing RTCO components — refine adds structure, 200
 *   F4: LLM rewritten field contains statute hallucination — filter-reject, retry
 *       with clean output, 200 on second call
 *   F5: breaker open — 503
 *
 * Mock boundary: breaker.fire.
 * ROI sidecar mocked to prevent real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockInstance } from "vitest";
import express from "express";
import { handleRefine } from "../../server/lib/llm-endpoints.js";
import type { Refine } from "../../server/schemas/refine.js";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../server/lib/breaker.js", () => ({
  breaker: { fire: vi.fn() },
  getBreakerState: vi.fn(() => ({
    state: "closed",
    failure_count: 0,
    last_failure_ts: null,
  })),
}));

vi.mock("../../api/src/lib/roi-sidecar.js", () => ({
  emitEvent: vi.fn(),
  newTraceId: () => "test-trace-refine",
  EventKind: {
    LLM_CALL: "llm_call",
    PROMPT_CRITIQUE: "prompt_critique",
    PROMPT_REFINE: "prompt_refine",
    PROMPT_PREVIEW: "prompt_preview",
  },
}));

const getBreakerMock = async () => {
  const mod = await import("../../server/lib/breaker.js");
  return mod.breaker.fire as MockInstance;
};

// ─── Request / response factories ────────────────────────────────────────────

const mockReq = (
  body: unknown,
  headers: Record<string, string> = {}
): express.Request =>
  ({
    body,
    headers,
    ip: "127.0.0.1",
    socket: { remoteAddress: "127.0.0.1" },
  }) as unknown as express.Request;

const mockRes = () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res;
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Fully valid Refine — no hallucinations. */
const VALID_REFINE: Refine = {
  rewritten:
    "As a county staff member, summarize the public records request in 2-3 sentences. Only use the attached document. Do not make up statistics.",
  applied_techniques: [3, 7],
  notes: "Added role and output constraints. Added anti-hallucination clause.",
};

/** Refine that adds RTCO structure to a bare prompt. */
const STRUCTURED_REFINE: Refine = {
  rewritten:
    "You are a county records analyst. Review the following meeting agenda and list any agenda items that lack a staff report. Return your findings as a bulleted list. Only include items explicitly mentioned in the agenda — do not infer or fabricate.",
  applied_techniques: [3],
  notes:
    "Added role, sharpened task, specified output format, added anti-hallucination clause.",
};

/** Refine where the coach relays refusal by using a placeholder for county-specific content. */
const PLACEHOLDER_REFINE: Refine = {
  rewritten:
    "You are a county budget analyst. Summarize the key line items in the [INSERT DEPARTMENT NAME] department budget for [INSERT FISCAL YEAR]. Present the summary as a bulleted list with dollar amounts from the attached document. Do not fabricate figures.",
  applied_techniques: [5],
  notes:
    "Prompt asked for specific department budget figures the coach cannot supply. Replaced with [INSERT DEPARTMENT NAME] and [INSERT FISCAL YEAR] placeholders per domain lock.",
};

/** Refine whose rewritten field contains a Florida statute citation — triggers filter-reject. */
const HALLUCINATED_REFINE: Refine = {
  rewritten:
    "As a county attorney, review the public records request under Fla. Stat. § 119.07 and advise on exemptions. Only cite sources in the attached document.",
  applied_techniques: [3],
  notes: "Added role and output constraints.",
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("handleRefine — eval fixtures", () => {
  let fireMock: MockInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    fireMock = await getBreakerMock();
  });

  // F1 — factual-county-content request: placeholder in rewritten, notes explain
  it("F1: factual county prompt → 200 with placeholder in rewritten and note", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(PLACEHOLDER_REFINE));
    const req = mockReq({
      prompt: "What is the FY2025 Parks department budget? Write a summary.",
    });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Refine; flags: unknown[] };
    expect(body.result.rewritten).toMatch(/\[INSERT/);
    expect(body.result.notes).toMatch(/placeholder/i);
    expect(body.flags).toHaveLength(0);
  });

  // F2 — well-formed prompt: clean refine, 200
  it("F2: well-formed prompt → 200 with clean rewritten output", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(VALID_REFINE));
    const req = mockReq({
      prompt: "Summarize the public records request.",
    });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Refine; flags: unknown[] };
    expect(body.result.rewritten.length).toBeGreaterThan(0);
    expect(body.result.applied_techniques.length).toBeGreaterThan(0);
    expect(body.flags).toHaveLength(0);
  });

  // F3 — missing RTCO: coach adds structure
  it("F3: bare prompt with no RTCO → 200 with structured rewritten field", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(STRUCTURED_REFINE));
    const req = mockReq({ prompt: "check the agenda" });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Refine; flags: unknown[] };
    // Notes should mention at least one structural addition
    expect(body.result.notes).toMatch(/role|task|output|anti-hallucination/i);
    expect(body.result.applied_techniques).not.toHaveLength(0);
  });

  // F4 — rewritten field contains statute citation: filter-reject → retry → 200
  it("F4: hallucinated statute in rewritten → filter-reject, retry returns clean, 200", async () => {
    // First call returns hallucination, second returns clean
    fireMock
      .mockResolvedValueOnce(JSON.stringify(HALLUCINATED_REFINE))
      .mockResolvedValueOnce(JSON.stringify(VALID_REFINE));
    const req = mockReq({
      prompt:
        "You are a county attorney. Review the public records request and advise on exemptions.",
    });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Refine; flags: unknown[] };
    // After successful retry, rewritten must NOT contain the redacted hallucination
    expect(body.result.rewritten).not.toContain("[REDACTED:");
    // The clean retry result is returned — no florida_statute marker
    expect(body.result.rewritten).not.toContain("Fla. Stat.");
    // fire was called twice (first attempt + retry)
    expect(fireMock).toHaveBeenCalledTimes(2);
  });

  // F5 — breaker open: 503
  it("F5: breaker open → 503 with unavailable message", async () => {
    fireMock.mockResolvedValueOnce({ __breaker_open: true });
    const req = mockReq({ prompt: "Rewrite the budget memo prompt." });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(503);
    const body = res.body as { error: string };
    expect(body.error).toMatch(/temporarily unavailable/i);
  });
});
