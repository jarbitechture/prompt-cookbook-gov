/**
 * preview.test.ts — Task #10 eval gate
 *
 * 5 fixtures covering the per-mode contract for handlePreview:
 *   F1: factual-county-content request — gap surfaced, 200
 *   F2: well-formed prompt — clear interpretation, no gaps, 200
 *   F3: missing RTCO components — gaps and unclear populated, 200
 *   F4: LLM output contains dollar hallucination — redacted in interpretation, flags populated
 *   F5: schema validation fails then succeeds on retry — 200 on second call
 *
 * Mock boundary: breaker.fire.
 * ROI sidecar mocked to prevent real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockInstance } from "vitest";
import express from "express";
import { handlePreview } from "../../server/lib/llm-endpoints.js";
import type { Preview } from "../../server/schemas/preview.js";

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
  newTraceId: () => "test-trace-preview",
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

/** Preview with no gaps for a well-structured prompt. */
const CLEAN_PREVIEW: Preview = {
  interpretation:
    "The model will assume the role of a permit analyst and systematically check the attached building permit application for missing required fields, returning a numbered list.",
  gaps: [],
  unclear: [],
};

/** Preview for a factual-county-content prompt: gap identifies the missing fact. */
const FACTUAL_GAP_PREVIEW: Preview = {
  interpretation:
    "The model will attempt to answer a question about a specific Florida statute. It would either fabricate the statute text or refuse if it cannot access legal sources.",
  gaps: [
    "Prompt asks for the exact text of Fla. Stat. § 119.07 — a downstream AI would either fabricate this or refuse. The user should paste the statute text into the prompt.",
  ],
  unclear: [],
};

/** Preview for a prompt with no RTCO: gaps and unclear both populated. */
const WEAK_PROMPT_PREVIEW: Preview = {
  interpretation:
    "The model would interpret this as a vague open-ended request for help with a document, likely defaulting to a generic summary without any structural guidance.",
  gaps: [
    "No document or subject matter provided — the AI has nothing to act on.",
    "No output format specified — the AI will choose arbitrarily.",
  ],
  unclear: [
    "'help me' — ambiguous; different AI systems would interpret this as summarizing, editing, or rewriting.",
    "'something useful' — no constraint; the AI defines 'useful' on its own.",
  ],
};

/** Preview whose interpretation contains a dollar amount hallucination. */
const HALLUCINATED_PREVIEW: Preview = {
  interpretation:
    "The model would attempt to summarize the budget memo, potentially citing the $1.2M allocation for the Parks department as if it were sourced from an official document.",
  gaps: ["Prompt does not attach the actual budget memo."],
  unclear: [],
};

/** Fully valid preview — used as the retry success in F5. */
const VALID_PREVIEW: Preview = {
  interpretation:
    "The model will summarize the public records request.",
  gaps: ["No output length specified"],
  unclear: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("handlePreview — eval fixtures", () => {
  let fireMock: MockInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    fireMock = await getBreakerMock();
  });

  // F1 — factual county prompt: gap surfaced in gaps array
  it("F1: factual county prompt → 200 with gap identifying missing fact", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(FACTUAL_GAP_PREVIEW));
    const req = mockReq({
      prompt: "What is the exact text of Fla. Stat. § 119.07?",
    });
    const res = mockRes();
    await handlePreview(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Preview; flags: unknown[] };
    expect(body.result.gaps.length).toBeGreaterThan(0);
    expect(
      body.result.gaps.some((g) => /fabricate|refuse|statute/i.test(g))
    ).toBe(true);
  });

  // F2 — well-formed prompt: clean preview, no gaps
  it("F2: well-formed prompt → 200 with interpretation and no gaps", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(CLEAN_PREVIEW));
    const req = mockReq({
      prompt:
        "You are a county permit analyst. Review the attached building permit application and list any missing required fields. Return a numbered list.",
    });
    const res = mockRes();
    await handlePreview(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Preview; flags: unknown[] };
    expect(body.result.interpretation.length).toBeGreaterThan(0);
    expect(body.result.gaps).toHaveLength(0);
    expect(body.flags).toHaveLength(0);
  });

  // F3 — missing RTCO: gaps and unclear populated
  it("F3: bare prompt → 200 with gaps and unclear arrays populated", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(WEAK_PROMPT_PREVIEW));
    const req = mockReq({ prompt: "help me do something useful" });
    const res = mockRes();
    await handlePreview(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Preview; flags: unknown[] };
    expect(body.result.gaps.length).toBeGreaterThan(0);
    expect(body.result.unclear.length).toBeGreaterThan(0);
  });

  // F4 — LLM output contains dollar amount hallucination: preview mode redacts
  it("F4: LLM output contains dollar amount → redacted in interpretation, flags populated", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(HALLUCINATED_PREVIEW));
    const req = mockReq({
      prompt: "Summarize the budget memo for Parks department.",
    });
    const res = mockRes();
    await handlePreview(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Preview; flags: unknown[] };
    // Preview mode redacts — $1.2M must be replaced
    expect(body.result.interpretation).toContain("[REDACTED:dollar_amount_large]");
    expect(body.flags).not.toHaveLength(0);
  });

  // F5 — schema validation failure on first call, retry returns valid JSON: 200
  it("F5: first call returns invalid JSON → retry returns valid schema, 200", async () => {
    // First call: non-JSON string triggers parse-failure path → retry
    fireMock
      .mockResolvedValueOnce("I cannot help with that request.")
      .mockResolvedValueOnce(JSON.stringify(VALID_PREVIEW));
    const req = mockReq({ prompt: "Summarize the public records request." });
    const res = mockRes();
    await handlePreview(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Preview; flags: unknown[] };
    expect(body.result.interpretation.length).toBeGreaterThan(0);
    // fire called twice: first attempt + retry
    expect(fireMock).toHaveBeenCalledTimes(2);
  });
});
