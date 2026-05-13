/**
 * critique.test.ts — Task #10 eval gate
 *
 * 5 fixtures covering the per-mode contract for handleCritique:
 *   F1: factual-county-content request — relay refusal language, 200
 *   F2: well-formed prompt — positive critique, 200
 *   F3: missing RTCO components — flags all missing, 200
 *   F4: LLM output contains regex hallucination — redacted in result, flags populated
 *   F5: breaker open — 503
 *
 * Mock boundary: breaker.fire (not callCivicAi).
 * ROI sidecar mocked to prevent real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockInstance } from "vitest";
import express from "express";
import { handleCritique } from "../../server/lib/llm-endpoints.js";
import type { Critique } from "../../server/schemas/critique.js";

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
  newTraceId: () => "test-trace-critique",
  EventKind: {
    LLM_CALL: "llm_call",
    PROMPT_CRITIQUE: "prompt_critique",
    PROMPT_REFINE: "prompt_refine",
    PROMPT_PREVIEW: "prompt_preview",
  },
}));

// Lazy import so vi.mock hoisting wires up before module init.
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

/** A fully valid Critique the mock can return. */
const VALID_CRITIQUE: Critique = {
  rtco: {
    role: "present",
    task: "present",
    context: "weak",
    output: "present",
  },
  anti_hallucination_clause: true,
  specificity_issues: [],
  suggestions: ["Add explicit output format specification."],
  cited_chapters: [3],
};

/** Critique with all RTCO fields missing. */
const MISSING_RTCO_CRITIQUE: Critique = {
  rtco: {
    role: "missing",
    task: "missing",
    context: "missing",
    output: "missing",
  },
  anti_hallucination_clause: false,
  specificity_issues: ["'help me'", "'something useful'"],
  suggestions: [
    "Add a role (e.g., 'You are a county records analyst').",
    "Specify the exact task.",
    "Provide context about the records request.",
    "Define the desired output format.",
  ],
  cited_chapters: [],
};

/** Critique whose suggestions array contains a Florida statute citation. */
const HALLUCINATED_CRITIQUE: Critique = {
  rtco: {
    role: "present",
    task: "present",
    context: "present",
    output: "present",
  },
  anti_hallucination_clause: false,
  specificity_issues: [],
  suggestions: [
    "The prompt should reference Fla. Stat. § 119.07 for public records obligations.",
  ],
  cited_chapters: [5],
};

/** Critique the mock returns when the system relays a factual-county refusal. */
const REFUSAL_CRITIQUE: Critique = {
  rtco: {
    role: "missing",
    task: "present",
    context: "missing",
    output: "missing",
  },
  anti_hallucination_clause: false,
  specificity_issues: [],
  suggestions: [
    "This prompt asks for a specific Florida statute lookup — the coach cannot supply that fact. The user should insert the statute citation themselves or source it from official documents.",
  ],
  cited_chapters: [],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("handleCritique — eval fixtures", () => {
  let fireMock: MockInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    fireMock = await getBreakerMock();
  });

  // F1 — factual-county-content request: relay refusal language in suggestions
  it("F1: factual county prompt → 200 with refusal guidance in suggestions", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(REFUSAL_CRITIQUE));
    const req = mockReq({
      prompt: "What is the exact text of Fla. Stat. § 119.07?",
    });
    const res = mockRes();
    await handleCritique(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Critique; flags: unknown[] };
    const suggestions = body.result.suggestions as string[];
    expect(suggestions.some((s) => /cannot supply|insert.*yourself|source it/i.test(s))).toBe(true);
  });

  // F2 — well-formed prompt: positive critique returned
  it("F2: well-formed prompt → 200 with positive critique", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(VALID_CRITIQUE));
    const req = mockReq({
      prompt:
        "You are a county permit analyst. Review the attached building permit application and list any missing required fields. Return your findings as a numbered list.",
    });
    const res = mockRes();
    await handleCritique(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Critique; flags: unknown[] };
    expect(body.result.rtco.role).toBe("present");
    expect(body.result.rtco.task).toBe("present");
    expect(body.flags).toHaveLength(0);
  });

  // F3 — missing RTCO: all four fields flagged as missing
  it("F3: prompt with no RTCO components → 200 with all RTCO fields missing", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(MISSING_RTCO_CRITIQUE));
    const req = mockReq({ prompt: "help me do something useful" });
    const res = mockRes();
    await handleCritique(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Critique; flags: unknown[] };
    const rtco = body.result.rtco;
    expect(rtco.role).toBe("missing");
    expect(rtco.task).toBe("missing");
    expect(rtco.context).toBe("missing");
    expect(rtco.output).toBe("missing");
    expect(body.result.suggestions.length).toBeGreaterThanOrEqual(4);
  });

  // F4 — LLM output contains Florida statute hallucination: critique mode redacts
  it("F4: LLM output contains statute citation → redacted in result, flags populated", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(HALLUCINATED_CRITIQUE));
    const req = mockReq({
      prompt:
        "You are a public records officer. Summarize the public records obligations for county staff. Return a brief paragraph.",
    });
    const res = mockRes();
    await handleCritique(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    const body = res.body as { result: Critique; flags: unknown[] };
    // Critique mode redacts — suggestion containing the statute must be scrubbed
    const suggestions = body.result.suggestions as string[];
    expect(
      suggestions.some((s) => s.includes("[REDACTED:florida_statute]"))
    ).toBe(true);
    expect(body.flags).not.toHaveLength(0);
  });

  // F5 — breaker open: 503
  it("F5: breaker open → 503 with unavailable message", async () => {
    fireMock.mockResolvedValueOnce({ __breaker_open: true });
    const req = mockReq({ prompt: "Summarize the budget memo." });
    const res = mockRes();
    await handleCritique(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(503);
    const body = res.body as { error: string };
    expect(body.error).toMatch(/temporarily unavailable/i);
  });
});
