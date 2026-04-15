import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import helmet from "helmet";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Rate limiter (in-memory, per IP)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 30;

interface RateBucket {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateBucket>();

function rateLimit(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  let bucket = rateBuckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }

  bucket.count += 1;

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - bucket.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));

  if (bucket.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: "Too many requests. Try again later." });
    return;
  }

  next();
}

// Periodically clean up stale buckets (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of rateBuckets) {
    if (now >= bucket.resetAt) {
      rateBuckets.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// OpenAI client
// ---------------------------------------------------------------------------
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.COOKBOOK_LLM_API_KEY;
  if (!apiKey) {
    return null;
  }
  const baseURL = process.env.COOKBOOK_LLM_BASE_URL;
  return new OpenAI({ apiKey, ...(baseURL && { baseURL }) });
}

function requireLLM(res: express.Response): boolean {
  if (!getOpenAIClient()) {
    res.status(503).json({
      error: "Live AI features are not configured. Set COOKBOOK_LLM_API_KEY in Application Settings to enable Try It and Chat.",
    });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// SSE streaming helper
// ---------------------------------------------------------------------------
async function streamCompletion(
  res: express.Response,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  model: string,
) {
  const client = getOpenAIClient()!;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const timeoutMs = 30_000;
  const timeout = setTimeout(() => {
    res.write("data: [DONE]\n\n");
    res.end();
  }, timeoutMs);

  let disconnected = false;
  res.on("close", () => {
    disconnected = true;
  });

  try {
    const stream = await client.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (disconnected) {
        stream.controller.abort();
        break;
      }
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (!disconnected) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err: unknown) {
    console.error("streamCompletion error:", err);
    if (!disconnected) {
      const message = "An error occurred while generating the response";
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Model whitelist
// ---------------------------------------------------------------------------
const ALLOWED_MODELS = new Set(["gpt-4o-mini", "gpt-3.5-turbo"]);
const DEFAULT_MODEL = "gpt-4o-mini";

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
async function startServer() {
  const app = express();
  const server = createServer(app);

  // Only trust proxy when explicitly configured
  if (process.env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  // Security headers — CSP + SharePoint iframe embedding
  const SHAREPOINT_ORIGINS = (process.env.SHAREPOINT_ORIGINS || "").split(",").filter(Boolean);
  const frameAncestors = SHAREPOINT_ORIGINS.length > 0
    ? `'self' ${SHAREPOINT_ORIGINS.join(" ")} *.sharepoint.com *.office.com`
    : "'self'";

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://d2xsxph8kpxj0f.cloudfront.net"],
        connectSrc: ["'self'", "https://*.logic.azure.com"],
        frameAncestors: frameAncestors.split(" "),
      },
    },
    frameguard: SHAREPOINT_ORIGINS.length > 0 ? false : undefined,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // CORS — allow SharePoint origins in production
  app.use(cors({
    origin: process.env.NODE_ENV === "production"
      ? SHAREPOINT_ORIGINS.length > 0
        ? (origin, callback) => {
            if (!origin || SHAREPOINT_ORIGINS.some(o => origin.startsWith(o)) || origin.includes(".sharepoint.com")) {
              callback(null, true);
            } else {
              callback(null, false);
            }
          }
        : false
      : true,
  }));

  // Body parser with 10KB limit
  app.use(express.json({ limit: "10kb" }));

  // Rate limiter on API routes
  app.use("/api", rateLimit);

  // ---- Health endpoint ----
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ---- Try-it endpoint (single prompt) ----
  app.post("/api/try-it", (req, res) => {
    if (!requireLLM(res)) return;
    const { prompt, model } = req.body ?? {};

    if (!prompt || typeof prompt !== "string") {
      res.status(400).json({ error: "prompt is required and must be a string" });
      return;
    }
    if (prompt.length > 10_000) {
      res.status(400).json({ error: "prompt must be 10000 characters or fewer" });
      return;
    }

    const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "user", content: prompt },
    ];

    streamCompletion(res, messages, safeModel).catch((err) => {
      console.error("try-it streaming error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  // ---- Chat endpoint (multi-turn) ----
  const CHAT_SYSTEM_MESSAGE = `You are Menu Planning, the AI prompt coach for the MCG Prompt Cookbook. You help Manatee County staff learn to write better prompts.

CRITICAL RULES:
- NEVER write complete prompts for the user. Guide them to build it themselves.
- Ask questions that help them think through what they need: "What role should the AI play?" "What specific output format do you need?"
- Give hints, frameworks, and examples of TECHNIQUE — not finished answers.
- If they ask "write me a prompt for X", respond with: "Let's build that together. First, who is the audience for the output?" Then walk them through RTCO step by step.
- Reference specific Cookbook chapters when relevant (e.g., "Chapter 23 covers chain-of-thought — try adding 'think step by step' to your prompt").
- Keep responses under 150 words. Be warm but direct.
- You are a coach, not a vending machine. The goal is for THEM to learn prompting, not for you to do it for them.`;

  app.post("/api/chat", (req, res) => {
    if (!requireLLM(res)) return;
    const { messages, model } = req.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "messages array is required and must not be empty" });
      return;
    }
    if (messages.length > 20) {
      res.status(400).json({ error: "messages array must have 20 or fewer messages" });
      return;
    }

    const validRoles = new Set(["user", "assistant"]);
    const sanitizedMessages = messages
      .filter((m: any) => validRoles.has(m.role))
      .map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: typeof m.content === "string" ? m.content.slice(0, 10000) : "",
      }));

    if (sanitizedMessages.length === 0) {
      res.status(400).json({ error: "No valid messages provided" });
      return;
    }

    const safeModel = ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL;

    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: CHAT_SYSTEM_MESSAGE },
      ...sanitizedMessages,
    ];

    streamCompletion(res, chatMessages, safeModel).catch((err) => {
      console.error("chat streaming error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  // ---- Static files ----
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(
    express.static(staticPath, {
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (/\.(js|css)$/.test(filePath)) {
          // Hashed assets can be cached long
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          // Images and other assets: no-cache forces revalidation each time
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // SPA fallback — serve index.html for all non-API routes
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down...");
    server.close(() => process.exit(0));
  });
}

startServer().catch(console.error);
