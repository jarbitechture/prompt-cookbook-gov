/**
 * Civic AI governed proxy client.
 *
 * Pure fetch-based HTTP client — no openai npm package.
 * No retry logic here; that's the circuit breaker's job.
 */

const CIVIC_AI_BASE_URL =
  process.env.CIVIC_AI_BASE_URL ?? "http://127.0.0.1:8100/v1";
const CIVIC_AI_API_KEY = process.env.CIVIC_AI_API_KEY ?? "";
const CIVIC_AI_DEFAULT_MODEL =
  process.env.CIVIC_AI_DEFAULT_MODEL ?? "phi4";

export interface CivicAiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CivicAiOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
  /**
   * Trace ID generated at request entry in llm-endpoints.ts.
   * Forwarded to civic-ai as the `x-trace-id` request header so that
   * civic-ai audit log rows can be joined to cookbook ROI events for the
   * same request. Header convention: custom `x-trace-id` (simple string
   * passthrough matching the ROI event field name). W3C `traceparent`
   * migration is a separate future task.
   */
  traceId?: string;
}

/**
 * Call the Civic AI governed proxy (non-streaming).
 *
 * Throws on any non-2xx HTTP status. The thrown error carries a numeric
 * `status` property so the circuit-breaker's `errorFilter` can exclude
 * client-error status codes from tripping the breaker.
 */
export async function callCivicAi(
  messages: CivicAiMessage[],
  options?: CivicAiOptions,
): Promise<string> {
  const body: Record<string, unknown> = {
    model: options?.model ?? CIVIC_AI_DEFAULT_MODEL,
    messages,
    stream: false,
    temperature: options?.temperature ?? 0.7,
  };

  if (options?.max_tokens !== undefined) {
    body.max_tokens = options.max_tokens;
  }
  if (options?.response_format !== undefined) {
    body.response_format = options.response_format;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (CIVIC_AI_API_KEY) {
    headers["Authorization"] = `Bearer ${CIVIC_AI_API_KEY}`;
  }
  if (options?.traceId !== undefined) {
    headers["x-trace-id"] = options.traceId;
  }

  const response = await fetch(`${CIVIC_AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const err = new Error(
      `Civic AI proxy returned ${response.status}: ${detail}`,
    ) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("Civic AI proxy returned an unexpected response shape");
  }

  return content;
}
