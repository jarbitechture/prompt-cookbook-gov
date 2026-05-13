/**
 * roi-emit.test.ts — Task #11
 *
 * strict_tdd — failing test first.
 * Covers emitTemplateExportEvent shape and the POST /api/roi/template-export route.
 *
 * No globals — explicit vitest imports.
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import type { AddressInfo } from "node:net";

// ─── Mock roi-sidecar before importing roi-emit ───────────────────────────────

vi.mock("../../api/src/lib/roi-sidecar.js", () => ({
  emitEvent: vi.fn(),
  EventKind: {
    LLM_CALL: "llm_call",
    TOOL_INVOCATION: "tool_invocation",
    GPT_PICK: "gpt_pick",
    PROJECT_ACCESS: "project_access",
    FILE_INTERACTION: "file_interaction",
    RAG_HIT: "rag_hit",
    LICENSE_LIFECYCLE: "license_lifecycle",
    HEADCOUNT_ATTESTATION: "headcount_attestation",
    FEEDBACK: "feedback",
    ESCALATION: "escalation",
    TRAINING_INTERACTION: "training_interaction",
    SESSION_START: "session_start",
    PROMPT_RECEIVED: "prompt_received",
    STREAM_COMPLETE: "stream_complete",
    CITATION_SURFACED: "citation_surfaced",
    FOLLOWUP_ACTION: "followup_action",
    PROMPT_CRITIQUE: "prompt_critique",
    PROMPT_REFINE: "prompt_refine",
    PROMPT_PREVIEW: "prompt_preview",
    TEMPLATE_EXPORT: "template_export",
  },
  newTraceId: () => "a".repeat(32),
  newSpanId: () => "b".repeat(16),
  startDrainLoop: vi.fn(),
  stopDrainLoop: vi.fn(),
}));

import { emitEvent } from "../../api/src/lib/roi-sidecar.js";
import { emitTemplateExportEvent } from "./roi-emit.js";

// ─── emitTemplateExportEvent shape ───────────────────────────────────────────

describe("emitTemplateExportEvent", () => {
  const mockReq = {
    headers: {
      "iisaf-username": "jsmith",
      "iisaf-dept": "admin",
      "iisaf-roleband": "manager",
    },
  } as any;

  beforeEach(() => {
    vi.mocked(emitEvent).mockClear();
  });

  it("calls emitEvent with event_kind=template_export", () => {
    const startTs = Date.now() - 50;
    emitTemplateExportEvent(mockReq, "copilot", "critique", startTs);

    expect(vi.mocked(emitEvent)).toHaveBeenCalledOnce();
    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg.event_kind).toBe("template_export");
  });

  it("includes target_tool in the emitted event", () => {
    const startTs = Date.now() - 50;
    emitTemplateExportEvent(mockReq, "chatgpt_enterprise", "preview", startTs);

    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg.target_tool).toBe("chatgpt_enterprise");
  });

  it("extracts user_id / dept / role_band from IIS headers", () => {
    const startTs = Date.now() - 50;
    emitTemplateExportEvent(mockReq, "copilot", undefined, startTs);

    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg.user_id).toBe("jsmith");
    expect(arg.dept).toBe("admin");
    expect(arg.role_band).toBe("manager");
  });

  it("falls back to defaults when IIS headers absent", () => {
    const reqNoHeaders = { headers: {} } as any;
    emitTemplateExportEvent(reqNoHeaders, "copilot", undefined, Date.now());

    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg.user_id).toBe("anonymous");
    expect(arg.dept).toBe("unknown");
    expect(arg.role_band).toBe("professional");
  });

  it("sets success=true (handoff initiated)", () => {
    emitTemplateExportEvent(mockReq, "copilot", "refine", Date.now());
    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg.success).toBe(true);
  });

  it("includes mode in the emitted event when provided", () => {
    emitTemplateExportEvent(mockReq, "copilot", "manual", Date.now());
    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg.mode).toBe("manual");
  });

  it("omits mode field when mode is undefined", () => {
    emitTemplateExportEvent(mockReq, "copilot", undefined, Date.now());
    const arg = vi.mocked(emitEvent).mock.calls[0][0];
    expect(arg).not.toHaveProperty("mode");
  });
});

// ─── Route: POST /api/roi/template-export ────────────────────────────────────

describe("POST /api/roi/template-export", () => {
  let baseUrl: string;
  let server: import("node:http").Server;

  beforeAll(async () => {
    const { createTemplateExportApp } = await import("../routes/roi-template-export.js");
    const app = createTemplateExportApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const port = (server.address() as AddressInfo).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    vi.mocked(emitEvent).mockClear();
  });

  it("returns 204 on valid body (copilot, critique)", async () => {
    const res = await fetch(`${baseUrl}/api/roi/template-export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_tool: "copilot", mode: "critique" }),
    });
    expect(res.status).toBe(204);
  });

  it("returns 204 when mode is omitted (optional field)", async () => {
    const res = await fetch(`${baseUrl}/api/roi/template-export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_tool: "chatgpt_enterprise" }),
    });
    expect(res.status).toBe(204);
  });

  it("returns 204 for all valid mode values", async () => {
    const modes = ["critique", "refine", "preview", "manual"] as const;
    for (const mode of modes) {
      const res = await fetch(`${baseUrl}/api/roi/template-export`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target_tool: "copilot", mode }),
      });
      expect(res.status, `mode=${mode}`).toBe(204);
    }
  });

  it("returns 400 on unknown target_tool", async () => {
    const res = await fetch(`${baseUrl}/api/roi/template-export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_tool: "unknown_tool" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 on unknown mode value", async () => {
    const res = await fetch(`${baseUrl}/api/roi/template-export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_tool: "copilot", mode: "invalid_mode" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when target_tool is missing", async () => {
    const res = await fetch(`${baseUrl}/api/roi/template-export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "critique" }),
    });
    expect(res.status).toBe(400);
  });

  it("calls emitEvent once on a valid request", async () => {
    await fetch(`${baseUrl}/api/roi/template-export`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ target_tool: "copilot", mode: "preview" }),
    });
    expect(vi.mocked(emitEvent)).toHaveBeenCalledOnce();
  });
});
