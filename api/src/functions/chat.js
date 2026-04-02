import { app } from "@azure/functions";
import OpenAI from "openai";

const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]);
const DEFAULT_MODEL = "gpt-4o-mini";

const SYSTEM_MESSAGE = `You are Menu Planning, the AI prompt coach for the MCG Prompt Cookbook. You help Manatee County staff learn to write better prompts.

CRITICAL RULES:
- NEVER write complete prompts for the user. Guide them to build it themselves.
- Ask questions that help them think through what they need: "What role should the AI play?" "What specific output format do you need?"
- Give hints, frameworks, and examples of TECHNIQUE — not finished answers.
- If they ask "write me a prompt for X", respond with: "Let's build that together. First, who is the audience for the output?" Then walk them through RTCO step by step.
- Reference specific Cookbook chapters when relevant (e.g., "Chapter 23 covers chain-of-thought — try adding 'think step by step' to your prompt").
- Keep responses under 150 words. Be warm but direct.
- You are a coach, not a vending machine. The goal is for THEM to learn prompting, not for you to do it for them.`;

app.http("chat", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "chat",
  handler: async (request) => {
    const apiKey = process.env.COOKBOOK_LLM_API_KEY;
    if (!apiKey) return { status: 500, jsonBody: { error: "API key not configured" } };

    const body = await request.json();
    const { messages, model } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return { status: 400, jsonBody: { error: "messages array is required" } };
    }

    const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;
    const openai = new OpenAI({ apiKey });

    const validRoles = new Set(["user", "assistant", "system"]);
    const sanitized = messages
      .filter((m) => validRoles.has(m.role) && typeof m.content === "string")
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    const apiMessages = [{ role: "system", content: SYSTEM_MESSAGE }, ...sanitized];

    try {
      const stream = await openai.chat.completions.create({
        model: safeModel,
        messages: apiMessages,
        stream: true,
        max_tokens: 1024,
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
