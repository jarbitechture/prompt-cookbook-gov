import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import { getBreakerState } from "./lib/breaker.js";
import { handleCritique, handleRefine, handlePreview } from "./lib/llm-endpoints.js";
import { handleTemplateExport } from "./routes/roi-template-export.js";

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

  // ---- Circuit-breaker health endpoint ----
  app.get("/api/health/breakers", (_req, res) => {
    res.json({ civic_ai: getBreakerState() });
  });

  // ---- Coach endpoints ----
  app.post("/api/critique", (req, res) => {
    handleCritique(req, res).catch((err) => {
      console.error("critique error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  app.post("/api/refine", (req, res) => {
    handleRefine(req, res).catch((err) => {
      console.error("refine error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  app.post("/api/preview", (req, res) => {
    handlePreview(req, res).catch((err) => {
      console.error("preview error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  app.post("/api/roi/template-export", (req, res) => {
    handleTemplateExport(req, res).catch((err) => {
      console.error("template-export error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  });

  // ---- Static files (multi-bundle) ----
  // Production layout (after pnpm build):
  //   dist/portal/    → served at /
  //   dist/cookbook/  → served at /cookbook/
  //   dist/builder/   → served at /builder/
  //
  // In production IIS handles routing; Express serves the same paths for
  // `pnpm start` local testing.  Each mount gets its own SPA fallback so
  // deep-linking works.
  const distBase =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname) // __dirname = dist/ in the esbuild bundle
      : path.resolve(__dirname, "..", "dist");

  function staticMiddleware(dir: string) {
    return express.static(dir, {
      etag: true,
      lastModified: true,
      setHeaders(res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (/\.(js|css)$/.test(filePath)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    });
  }

  // Cookbook bundle — must be mounted before portal so /cookbook/* is matched first
  const cookbookPath = path.join(distBase, "cookbook");
  app.use("/cookbook", staticMiddleware(cookbookPath));
  app.get("/cookbook/*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(cookbookPath, "index.html"));
  });

  // Builder bundle
  const builderPath = path.join(distBase, "builder");
  app.use("/builder", staticMiddleware(builderPath));
  app.get("/builder/*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(builderPath, "index.html"));
  });

  // Portal bundle — catch-all at root (must be last)
  const portalPath = path.join(distBase, "portal");
  app.use(staticMiddleware(portalPath));
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(portalPath, "index.html"));
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
