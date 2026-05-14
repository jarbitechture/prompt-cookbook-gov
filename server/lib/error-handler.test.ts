/**
 * error-handler.test.ts — P0-B
 *
 * Verifies the global Express error handler:
 *   1. Returns JSON, not HTML
 *   2. Maps 413 → payload_too_large, 400 → bad_request, 500 → internal_error
 *   3. Never leaks filesystem paths, stack frames, or pnpm fingerprints
 *      into the response body
 *
 * Uses the existing `app.listen(0)` + native fetch pattern (no supertest).
 */
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { errorHandler } from "./error-handler.js";

// ─── Fixture app ────────────────────────────────────────────────────────────────

function buildApp(): express.Express {
  const app = express();
  // 10KB body limit — production parity
  app.use(express.json({ limit: "10kb" }));

  // A route that always throws, to exercise the 500 branch.
  app.post("/throw", (_req, _res, next) => {
    next(new Error("/Users/ejarbe/Projects/foo/node_modules/.pnpm/raw-body@2.5.2/bad"));
  });

  // /api/critique is the real victim in the audit — match shape.
  app.post("/api/critique", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  // MUST be registered last
  app.use(errorHandler);
  return app;
}

let server: Server;
let baseUrl: string;
let consoleSpy: ReturnType<typeof vi.spyOn>;

beforeAll(async () => {
  const app = buildApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as AddressInfo;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  // Silence the [error-handler] console.error noise during tests; we
  // assert against the response body, not the log.
  consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleSpy.mockRestore();
});

// ─── Leak markers ───────────────────────────────────────────────────────────────

/**
 * Patterns that MUST NOT appear in any response body. If the default
 * Express HTML error response slips through, one of these will match.
 */
const LEAK_PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: "absolute_path",  re: /\/Users\/[a-zA-Z]+\// },
  { name: "node_modules",   re: /node_modules/ },
  { name: "pnpm_fingerprint", re: /\.pnpm/ },
  { name: "html_error_page", re: /<!DOCTYPE html|<html|<pre>Error:/i },
  { name: "stack_frame",    re: /\s+at\s+\S+ \(\S+:\d+:\d+\)/ },
];

function expectNoLeak(body: string): void {
  for (const { name, re } of LEAK_PATTERNS) {
    expect(body, `leaked ${name}: ${body.slice(0, 200)}`).not.toMatch(re);
  }
}

// ─── 413 — payload too large ───────────────────────────────────────────────────

describe("errorHandler — 413", () => {
  it("returns JSON with code=payload_too_large for >10KB body", async () => {
    const oversized = "x".repeat(15 * 1024); // 15KB > 10KB limit
    const res = await fetch(`${baseUrl}/api/critique`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ blob: oversized }),
    });

    expect(res.status).toBe(413);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);

    const body = await res.text();
    expectNoLeak(body);

    const parsed = JSON.parse(body);
    expect(parsed).toMatchObject({
      error: "Request could not be processed",
      code: "payload_too_large",
    });
    // Defensive: keys must not include anything that hints at internals.
    expect(parsed).not.toHaveProperty("stack");
    expect(parsed).not.toHaveProperty("message");
  });
});

// ─── 400 — malformed JSON ──────────────────────────────────────────────────────

describe("errorHandler — 400", () => {
  it("returns JSON with code=bad_request for malformed JSON body", async () => {
    const res = await fetch(`${baseUrl}/api/critique`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-valid-json",
    });

    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);

    const body = await res.text();
    expectNoLeak(body);

    const parsed = JSON.parse(body);
    expect(parsed).toMatchObject({
      error: "Request could not be processed",
      code: "bad_request",
    });
  });
});

// ─── 500 — uncaught route error ────────────────────────────────────────────────

describe("errorHandler — 500", () => {
  it("returns JSON with code=internal_error and scrubs filesystem path from thrown error message", async () => {
    const res = await fetch(`${baseUrl}/throw`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toMatch(/application\/json/);

    const body = await res.text();
    // The thrown error message contained a path + pnpm fingerprint —
    // verify NONE of it appears in the response.
    expectNoLeak(body);

    const parsed = JSON.parse(body);
    expect(parsed).toMatchObject({
      error: "Request could not be processed",
      code: "internal_error",
    });
  });
});
