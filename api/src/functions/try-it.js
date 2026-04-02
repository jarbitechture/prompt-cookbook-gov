import { app } from "@azure/functions";
import OpenAI from "openai";

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]);
const DEFAULT_MODEL = "gpt-4o-mini";

app.http("try-it", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "try-it",
  handler: async (request) => {
    const apiKey = process.env.COOKBOOK_LLM_API_KEY;
    if (!apiKey) return { status: 500, jsonBody: { error: "API key not configured" } };

    const body = await request.json();
    const { prompt, model } = body;

    if (!prompt || typeof prompt !== "string") {
      return { status: 400, jsonBody: { error: "prompt is required" } };
    }
    if (prompt.length > 10000) {
      return { status: 400, jsonBody: { error: "prompt must be 10000 characters or fewer" } };
    }

    const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
    const openai = new OpenAI({ apiKey });

    try {
      const stream = await openai.chat.completions.create({
        model: safeModel,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        max_tokens: 2048,
        temperature: 0.7,
      });

      const chunks = [];
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) chunks.push(`data: ${JSON.stringify({ content })}\n\n`);
      }
      chunks.push("data: [DONE]\n\n");

      return {
        status: 200,
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
        body: chunks.join(""),
      };
    } catch (err) {
      return { status: 500, jsonBody: { error: "LLM request failed" } };
    }
  },
});
