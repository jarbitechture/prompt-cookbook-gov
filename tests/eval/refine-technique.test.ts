/**
 * refine-technique.test.ts — coverage for the new `technique` field on /api/refine.
 *
 * The Builder UI now sends `{ prompt, technique: TechniqueKey }` instead of
 * `{ prompt, chapter_id: number }`. This file pins:
 *
 *   T1: `technique` body → 200, routes through pinned-chapter retrieval for
 *       the mapped chapter number.
 *   T2: legacy `chapter_id` body → still 200 (back-compat).
 *   T3: neither field present → 400 with `code: "missing_refine_target"`.
 *   T4: unknown `technique` value → 400.
 *   T5: both fields present → 400 (mutually exclusive — prevents drift).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MockInstance } from "vitest";
import express from "express";
import { handleRefine } from "../../server/lib/llm-endpoints.js";
import type { Refine } from "../../server/schemas/refine.js";
import { TECHNIQUE_TO_CHAPTER } from "../../server/lib/technique-map.js";

// ─── Mocks (same boundary as refine.test.ts) ─────────────────────────────────

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
  newTraceId: () => "test-trace-technique",
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

const mockReq = (body: unknown): express.Request =>
  ({
    body,
    headers: {},
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

const VALID_REFINE: Refine = {
  rewritten:
    "You are a county records analyst. Summarize the request in 2-3 sentences. Only use the attached document.",
  applied_techniques: [3],
  notes: "Added role, sharpened task, specified output format.",
};

describe("handleRefine — technique field", () => {
  let fireMock: MockInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    fireMock = await getBreakerMock();
  });

  // T1 — technique key resolves to pinned chapter retrieval
  it("T1: technique=set-role → 200, breaker called once with system prompt containing the pinned chapter title", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(VALID_REFINE));
    const req = mockReq({
      prompt: "Help me write a budget memo.",
      technique: "set-role",
    });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
    expect(fireMock).toHaveBeenCalledTimes(1);

    // The pinned chapter for set-role is ch25 "Persona & Scenario Prompting".
    const args = fireMock.mock.calls[0];
    const messages = args[0] as { role: string; content: string }[];
    const systemMsg = messages.find((m) => m.role === "system");
    expect(systemMsg).toBeDefined();
    expect(systemMsg!.content).toMatch(/Persona/i);
  });

  it("T1b: every TechniqueKey routes through pinned retrieval without error", async () => {
    for (const [key, chapterNumber] of Object.entries(TECHNIQUE_TO_CHAPTER)) {
      fireMock.mockResolvedValueOnce(JSON.stringify(VALID_REFINE));
      const req = mockReq({ prompt: "Test prompt content.", technique: key });
      const res = mockRes();
      await handleRefine(req, res as unknown as express.Response);
      expect(res.statusCode, `${key} → chapter ${chapterNumber} returned ${res.statusCode}`).toBe(200);
    }
  });

  // T2 — legacy chapter_id still works
  it("T2: legacy chapter_id body → 200 (back-compat)", async () => {
    fireMock.mockResolvedValueOnce(JSON.stringify(VALID_REFINE));
    const req = mockReq({ prompt: "Help me write.", chapter_id: 23 });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(200);
  });

  // T3 — neither field
  it("T3: neither technique nor chapter_id → 400 with missing_refine_target", async () => {
    const req = mockReq({ prompt: "Some prompt." });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(400);
    const body = res.body as { error: string; code?: string };
    expect(body.code).toBe("missing_refine_target");
    // Breaker never reached.
    expect(fireMock).not.toHaveBeenCalled();
  });

  // T4 — unknown technique value
  it("T4: unknown technique → 400", async () => {
    const req = mockReq({ prompt: "Some prompt.", technique: "zeroshot" });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(400);
    expect(fireMock).not.toHaveBeenCalled();
  });

  // T5 — both fields present → 400 (mutually exclusive)
  it("T5: both technique and chapter_id present → 400", async () => {
    const req = mockReq({
      prompt: "Some prompt.",
      technique: "set-role",
      chapter_id: 23,
    });
    const res = mockRes();
    await handleRefine(req, res as unknown as express.Response);
    expect(res.statusCode).toBe(400);
    expect(fireMock).not.toHaveBeenCalled();
  });
});
