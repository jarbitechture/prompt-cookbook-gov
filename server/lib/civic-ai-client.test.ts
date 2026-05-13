/**
 * civic-ai-client.test.ts
 *
 * strict_tdd — verify that x-trace-id header is forwarded when traceId is
 * provided in CivicAiOptions, and is absent when traceId is omitted.
 *
 * No globals — explicit vitest imports.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { callCivicAi } from "./civic-ai-client.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OK_BODY = JSON.stringify({
  choices: [{ message: { content: "ok" } }],
});

function mockFetchOk(): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(OK_BODY, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const MESSAGES = [{ role: "user" as const, content: "hello" }];

// ─── x-trace-id header forwarding ────────────────────────────────────────────

describe("callCivicAi – x-trace-id header", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends x-trace-id header when traceId is provided", async () => {
    const fetchMock = mockFetchOk();
    const traceId = "abc123def456abc123def456abc12345";

    await callCivicAi(MESSAGES, { traceId });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["x-trace-id"]).toBe(traceId);
  });

  it("omits x-trace-id header when traceId is not provided", async () => {
    const fetchMock = mockFetchOk();

    await callCivicAi(MESSAGES, { temperature: 0.3 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("x-trace-id");
  });

  it("omits x-trace-id header when options is undefined", async () => {
    const fetchMock = mockFetchOk();

    await callCivicAi(MESSAGES);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers).not.toHaveProperty("x-trace-id");
  });

  it("traceId is forwarded independently of other options", async () => {
    // Verify traceId travels correctly alongside other CivicAiOptions fields.
    const fetchMock = mockFetchOk();
    const traceId = "trace-with-other-options";

    await callCivicAi(MESSAGES, { traceId, temperature: 0.9, max_tokens: 100 });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["x-trace-id"]).toBe(traceId);
    // traceId must NOT appear in the request body — it's a header only.
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).not.toHaveProperty("traceId");
    expect(body).not.toHaveProperty("trace_id");
  });
});
