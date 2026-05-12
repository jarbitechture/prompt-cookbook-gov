# MVP Pre-Deletion Audit — `prompt-cookbook-gov`

Date: 2026-05-12
Scope: Find every reference to code, routes, env vars, and deploy hooks slated for removal in MVP task #12 (LLM-passthrough → hallucination-bounded coach) and task #13 (subpath deployment). One row per finding, sorted HIGH/MEDIUM/LOW by failure mode.

Risk legend:
- **HIGH** — silent runtime breakage (404, hang, stale UI hitting dead route).
- **MEDIUM** — build/install failure or deploy script fails fast.
- **LOW** — stale comment, dead doc, no runtime effect.

---

## 1. Routes Being Deleted (`/api/try-it`, `/api/chat`)

### Server registrations

| File:line | What's referenced | Risk |
|---|---|---|
| `server/index.ts:218` | `app.post("/api/try-it", ...)` registration | HIGH — removing the handler must coincide with the 3 replacement endpoints, or every client fetch falls through to the SPA fallback at line 323 and returns `index.html` (browser then JSON.parse's HTML). |
| `server/index.ts:257` | `app.post("/api/chat", ...)` registration | HIGH — same SPA-fallback hazard. ChatbotWidget hangs on `response.body.getReader()` reading HTML. |
| `api/src/functions/try-it.js` | Entire Azure Function for `/api/try-it` (Azure Static Web Apps deploy path) | HIGH — file is auto-discovered by `@azure/functions` runtime. Whole file deletes cleanly. |
| `api/src/functions/chat.js` | Entire Azure Function for `/api/chat` | HIGH — same. |
| `api/src/functions/health.js` | `/api/health` (server-side equivalent at `server/index.ts:213`) | MEDIUM — task brief lumps this with the deletions, but it has no LLM coupling and `Game.tsx:793` depends on it. **Recommend KEEP** unless Static Web Apps deploy path is being retired entirely. |
| `staticwebapp.config.json:7` | `"/api/*"` route allowlist | LOW — generic wildcard. New endpoints fall under the same wildcard. |

### Client callers (every `fetch` against the dying routes)

| File:line | What's referenced | Risk |
|---|---|---|
| `client/src/components/TryItSection.tsx:56` | `fetch("/api/try-it", { method: "POST", ... })` — `handleRun()`, invoked from chapter detail Try It button (`ChapterDetail.tsx:993`) | HIGH — user-facing on every chapter page. |
| `client/src/components/ChatbotWidget.tsx:53` | `fetch("/api/chat", { method: "POST", ... })` — `handleSend()`, invoked from chatbot floating widget mounted in `App.tsx:72` | HIGH — globally rendered chatbot; mounts on every page. |
| `client/src/pages/Builder.tsx:688` | `streamSSE("/api/try-it", ...)` — Builder's "Run" button (`handleTryIt`) | HIGH — main Builder feature path. |
| `client/src/pages/Builder.tsx:1165` | `streamSSE("/api/try-it", ...)` — Builder's "Reverse-Engineer" button | HIGH — second Builder feature path. |
| `client/src/pages/Game.tsx:724` | `fetch("/api/try-it", ...)` inside `fetchSSE()` helper used by BlindArena live mode | HIGH — `/game` BlindArena live mode hits this twice per round. |
| `client/src/pages/Game.tsx:793` | `fetch("/api/health")` — gates `liveMode` ON/OFF in `BlindArena` | MEDIUM — keep `/api/health`; verify the new server still exposes it. |
| `client/src/pages/Game.tsx:1371` | `fetch("/api/try-it", ...)` — Challenge mode `handleSend()` | HIGH — Challenge mode submit. |

### Doc/runbook references (informational, no runtime effect)

| File:line | What's referenced | Risk |
|---|---|---|
| `README.md:79,93,123` | curl example, architecture summary, SSE buffering note | LOW |
| `RUNBOOK.md:53,346` | curl example, SSE buffering note | LOW |
| `mcp/README.md:81-82` | references `cookbookData.ts` and `roi-sidecar.js` (NOT the deleted routes) | n/a — survives |

---

## 2. Env Vars Being Removed (`COOKBOOK_LLM_*`)

### Code branches

| File:line | What's referenced | Risk |
|---|---|---|
| `server/index.ts:67` | `process.env.COOKBOOK_LLM_API_KEY` — `getOpenAIClient()` reads it | HIGH — deletion safe only after `getOpenAIClient`, `requireLLM`, `streamCompletion`, and the two route handlers are all removed together (see §3). Partial removal leaves `requireLLM` referencing a deleted env-var call site and the server still boots — but the route handlers throw at request time. |
| `server/index.ts:71` | `process.env.COOKBOOK_LLM_BASE_URL` | HIGH — same coupling. |
| `server/index.ts:78` | Error message string referencing `COOKBOOK_LLM_API_KEY` | LOW (text only; rip with the handler). |
| `server/index.ts:150` | `process.env.COOKBOOK_LLM_ALLOWED_MODELS` | HIGH — same coupling. |
| `server/index.ts:155` | `process.env.COOKBOOK_LLM_DEFAULT_MODEL` | HIGH — same coupling. |
| `api/src/functions/try-it.js:13` | `process.env.COOKBOOK_LLM_API_KEY` | HIGH — whole file goes. |
| `api/src/functions/chat.js:24` | `process.env.COOKBOOK_LLM_API_KEY` | HIGH — whole file goes. |

### Env-config files

| File:line | What's referenced | Risk |
|---|---|---|
| `.env.example:6,12` | `COOKBOOK_LLM_API_KEY=` / `COOKBOOK_LLM_BASE_URL=` placeholders | MEDIUM — replace with new MVP env vars so contributors don't check out a stale template. |
| `.env.local:5-8` | All 4 vars exported for local dev with infer01 values | MEDIUM — local dev script still works but the vars become noise. Replace with new ones. |

### Deploy / service scripts (set or read the vars)

| File:line | What's referenced | Risk |
|---|---|---|
| `start.ps1:5-8,13-14` | Sets all 4 vars in foreground starter; echoes BASE_URL/MODEL on startup | HIGH — script ships in the GitHub release tarball (`deploy.sh:18`) and is what operators paste to bring up the service. After deletion, it sets env vars the server no longer reads — silently misleading. Replace, do not just delete. |
| `install-service.ps1:30-33` | Sets all 4 vars on the `cookbook-node` NSSM service via `nssm set AppEnvironmentExtra` | HIGH — same; NSSM service env retains stale values until script re-runs. Replace. |
| `azure-pipelines.yml` | No COOKBOOK_LLM_* references — build-only pipeline, no deploy stage yet | LOW |

### Doc references

| File:line | What's referenced | Risk |
|---|---|---|
| `README.md:38-52,116,120,129-130` | Quick start, Docker, env-var table | LOW |
| `RUNBOOK.md:19,56,95-96,103-104,118-119,127,135-136,159,187,328-329,339` | Roadmap, verify curl, Azure/OpenAI/Ollama config examples, troubleshooting, deploy section | LOW |

---

## 3. Code Being Removed (`server/index.ts` helpers + Azure Functions + `openai` dep)

### `server/index.ts` helpers

| File:line | What's referenced | Risk |
|---|---|---|
| `server/index.ts:5` | `import OpenAI from "openai"` | MEDIUM — leaving the import after handlers go = unused import (tsc warning only). After dep removal it becomes a hard build failure. |
| `server/index.ts:66-73` | `getOpenAIClient()` function body | HIGH — see env-var coupling above. |
| `server/index.ts:75-83` | `requireLLM()` function body | HIGH — called only from the two doomed handlers; cleanest to drop together. |
| `server/index.ts:88-144` | `streamCompletion()` SSE helper | HIGH — same. |
| `server/index.ts:149-155` | `ALLOWED_MODELS` Set + `DEFAULT_MODEL` constant | HIGH — referenced inside `try-it`/`chat` handlers only. Safe to remove together. |
| `server/index.ts:246-256` | `CHAT_SYSTEM_MESSAGE` string constant (also mirrored in `api/src/functions/chat.js:8-17`) | LOW — dead string after handler removal; coach behavior moves to the new endpoints. |

### Azure Functions (Static Web Apps deploy path)

| File:line | What's referenced | Risk |
|---|---|---|
| `api/src/functions/try-it.js` | Whole file (71 lines): imports `@azure/functions`, `openai`, `withRoiEvent` from `../lib/roi-sidecar.js` | HIGH — file auto-loaded by `@azure/functions` host. ROI sidecar import is fine (file survives). |
| `api/src/functions/chat.js` | Whole file (91 lines): imports `@azure/functions`, `openai`, `withRoiEvent`, `EventKind` from `../lib/roi-sidecar.js` | HIGH — same. |
| `api/src/functions/health.js` | 10-line health endpoint; no LLM, no ROI | MEDIUM — see §1; **recommend KEEP** unless the SWA path is being retired. |

### `openai` npm dependency

| File:line | What's referenced | Risk |
|---|---|---|
| `package.json:25` | Root `"openai": "^6.34.0"` — only consumer is `server/index.ts:5` | MEDIUM — remove only AFTER `server/index.ts` import is gone. `pnpm install --frozen-lockfile` (Azure DevOps + Dockerfile) will fail if lockfile drifts; regenerate. |
| `api/package.json:8` | Sub-package `"openai": "^6.0.0"` — only consumers are `api/src/functions/try-it.js:2` and `chat.js:2` | MEDIUM — same. Remove with the function files. |
| `mcp/server.ts`, `mcp/smoke.ts`, `mcp/package.json` | **Verified: no `openai` import** in MCP. `grep -E "from .openai." mcp/` → 0 hits. | n/a — safe |

---

## 4. MCP Server Cross-Deps (must survive)

| File:line | What's referenced | Risk |
|---|---|---|
| `mcp/server.ts:32` | `import { chapters, type Chapter } from "../client/src/lib/cookbookData.js"` | HIGH if `cookbookData.ts` is touched. **Verified: cookbookData.ts is NOT on the deletion list** — it's the prompt-corpus source of truth and is also used by `client/src/lib/searchIndex.ts:6`. Keep. |
| `mcp/server.ts:33` | `import { withRoiEvent, EventKind, newTraceId } from "../api/src/lib/roi-sidecar.js"` | HIGH if `roi-sidecar.js` is touched. **Verified: file at `api/src/lib/roi-sidecar.js` survives — deletion targets are `api/src/functions/*.js`, not `api/src/lib/*`.** Keep. |
| `mcp/smoke.ts:7` | `import { chapters } from "../client/src/lib/cookbookData.js"` | HIGH if cookbookData is touched. Same as above — keep. |
| MCP touches anything we ARE deleting? | **No.** `grep "try-it\|/api/chat\|streamCompletion\|getOpenAIClient\|requireLLM\|COOKBOOK_LLM" mcp/*.ts` → 0 hits. | n/a — clean |

---

## 5. IIS / Deploy Configs That Assume `/` As Base Path (Task #13 blockers)

### Server-side rewrite / proxy rules (assume root)

| File:line | What's referenced | Risk |
|---|---|---|
| `iis-setup.ps1:11` | `$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'` — site root path | MEDIUM — fine for `mcgpt.mymanatee.org/` root deploy; under a subpath like `/cookbook/` this needs to be the *application* path with an IIS application alias. |
| `iis-setup.ps1:52-54` | `<match url="^api/(.*)" />` → `http://localhost:3000/api/{R:1}` | HIGH — `match url` is relative to the app base, so this survives a subpath app alias **only if** Node also serves the new path. If Vite is built with `base: "/cookbook/"` the SPA assets path moves; the API rewrite must still map `<app>/api/*` → `localhost:3000/api/*` (Node keeps `/api`). Verify with subpath under IIS. |
| `iis-setup.ps1:55-63` | SPA fallback rule rewrites everything not matching `^/api/` to `/index.html` (absolute) | HIGH — absolute `/index.html` is wrong under a subpath; needs to be `/cookbook/index.html` (or relative). |
| `iis-setup.ps1:89` | Smoke test against `http://localhost/api/health` | MEDIUM — would need `/cookbook/api/health` post-task-13. |
| `enable-auth.ps1:41-43` | Same `ReverseProxyToNode` rewrite as iis-setup.ps1 | HIGH — same subpath rewrite problem. |
| `enable-auth.ps1:51-53` | Same SPA fallback rewriting to `/index.html` | HIGH — same. |
| `enable-auth.ps1:13` | `$IISRoot = 'C:\inetpub\wwwroot\cookbook\public'` | MEDIUM — same as iis-setup.ps1:11. |
| `staticwebapp.config.json:3` | `"navigationFallback": { "rewrite": "/index.html" }` | HIGH — absolute root; breaks under SWA subpath routing (if SWA is still a target). |
| `staticwebapp.config.json:4` | `"exclude": ["/assets/*", "/chapters/*", "/api/*"]` — absolute paths | MEDIUM — paths assume root. |
| `staticwebapp.config.json:16` | `"404": { "rewrite": "/index.html" }` | HIGH — same. |

### Vite base config

| File:line | What's referenced | Risk |
|---|---|---|
| `vite.config.ts` (no `base:` field) | **Vite defaults to `base: "/"`** — all hashed asset URLs in `index.html` are absolute root paths (`/assets/...`) | HIGH — first thing to fix for task #13. Set `base: process.env.VITE_BASE ?? "/"`. Without this, deploying to `/cookbook/` returns a white screen — `index.html` references `/assets/index-XYZ.js` instead of `/cookbook/assets/index-XYZ.js`. |

### Client-side hardcoded root paths

| File:line | What's referenced | Risk |
|---|---|---|
| `client/src/components/TryItSection.tsx:109` | `window.location.href = "/builder"` | HIGH — absolute root nav. Breaks under subpath; use Wouter router. |
| `client/src/components/ChapterDetail.tsx:915,1010` | `window.location.href = "/builder"` (x2) | HIGH |
| `client/src/pages/Home.tsx:231,686` | `window.location.href = "/builder"` (x2) | HIGH |
| `client/src/components/Sidebar.tsx:64,177,194,204,212,220` | `window.location.href = "/"`, `"/resources..."`, `"/builder"`, `"/game"` (x6) | HIGH — sidebar mounts on every page. |
| Multiple `<Link href="/..." />` in `Game.tsx`, `Resources.tsx`, `Builder.tsx` | Wouter `<Link>` honors a router `base` prop **if set**. Wouter base is not currently configured. | HIGH — wrap routes in `<Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>` in `App.tsx` at the same time Vite base is added. |
| `client/src/components/TryItSection.tsx:56`, `ChatbotWidget.tsx:53`, `Builder.tsx:688,1165`, `Game.tsx:724,793,1371` | `fetch("/api/...")` — absolute API paths | HIGH — under subpath these resolve to `https://host/api/...` (root), bypassing the IIS app alias. Need an `apiUrl()` helper that prepends `import.meta.env.BASE_URL`. |

### `web.config` if present
- No checked-in `web.config` at repo root; both PS scripts (`iis-setup.ps1`, `enable-auth.ps1`) generate it inline. The two inline templates are the canonical source — covered above.

---

## 6. SharePoint Integration

| File:line | What's referenced | Risk |
|---|---|---|
| `sharepoint/form-body-formatting.json` | SharePoint row-formatting JSON (Content Details / Schedule & Status / Media & Links). No `try-it`, no `/api/chat`, no `COOKBOOK_LLM_*`, no `openai` references. | n/a — clean |
| `sharepoint/knowledge-base/` | Empty directory | n/a — clean |
| `server/index.ts:170-204` | `SHAREPOINT_ORIGINS` env var still used for CSP `frameAncestors` and CORS — iframe-embed path, unrelated to the LLM routes. | n/a — survives |
| `staticwebapp.config.json:13` | `"Content-Security-Policy": "frame-ancestors 'self' *.sharepoint.com *.office.com"` | n/a — survives |

SharePoint integration is purely iframe-host + CSP. No coupling to deleted code.

---

## Pre-Deletion Checklist

Apply in order. Each step is a single commit that the next step depends on.

1. **Add Vite + Wouter base support** before anything else (unblocks task #13 without changing behavior at `/`): set `base: process.env.VITE_BASE ?? "/"` in `vite.config.ts`, wrap routes in `<Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>` in `client/src/App.tsx`, and add a `client/src/lib/apiUrl.ts` helper that prepends `import.meta.env.BASE_URL`. Verify `pnpm run build && pnpm start` still serves at `/` correctly.
2. **Migrate the 11+ hardcoded `window.location.href = "/..."` sites and all `<Link href="/..." />` callers** to use Wouter's `useLocation()` or relative paths. Zero behavior change at root; do it before the deletion so regressions are isolated.
3. **Stand up the 3 new endpoints** (per MVP plan task #12) registered alongside the old ones in `server/index.ts`. Verify each end-to-end with a curl through the IIS reverse proxy.
4. **Repoint all 7 client fetch sites** (`TryItSection`, `ChatbotWidget`, `Builder.tsx` x2, `Game.tsx` x3) to the new endpoints via `apiUrl()`. Manual smoke each: Builder Run, Builder Reverse-Engineer, Game BlindArena live mode, Game Challenge submit, chapter Try It, floating Chatbot. Keep `/api/health` for the live-mode gate.
5. **Delete `api/src/functions/try-it.js` and `chat.js`** (NOT `health.js` — `Game.tsx:793` depends on it). Remove `"openai": "^6.0.0"` from `api/package.json`. Run `pnpm install` in `api/` to refresh the sub-lockfile.
6. **Delete the dead helpers and routes in `server/index.ts`** in one commit: the `openai` import (line 5), `getOpenAIClient`, `requireLLM`, `streamCompletion`, `ALLOWED_MODELS`, `DEFAULT_MODEL`, `CHAT_SYSTEM_MESSAGE`, `app.post("/api/try-it", ...)`, `app.post("/api/chat", ...)`. Run `pnpm run check` (tsc --noEmit) to catch stragglers.
7. **Remove `"openai": "^6.34.0"` from root `package.json`** and regenerate `pnpm-lock.yaml`. Verify `pnpm install --frozen-lockfile` succeeds (Azure DevOps + Dockerfile run this).
8. **Update env-config files and PS scripts** (these ship in the release tarball): `.env.example` (2 placeholders), `.env.local` (4 exports), `start.ps1` (4 `$env:COOKBOOK_LLM_*` assignments + 2 echo lines), `install-service.ps1` (4 entries in `nssm set ... AppEnvironmentExtra`).
9. **Update `iis-setup.ps1` and `enable-auth.ps1` rewrite templates for subpath** (task #13). The two `<action type="Rewrite" url="/index.html" />` lines and the `ReverseProxyToNode` rule both need to honor an injectable base. Both PS scripts must stay in lockstep — per `RUNBOOK.md:288` they're a known consistency hazard.
10. **Doc sweep (LOW risk, do last):** update `README.md` (lines 38-52, 79, 93, 116, 120, 123, 129-130), `RUNBOOK.md` (line 19 table, line 53 curl, lines 99-107 env table, line 159 troubleshooting, lines 328-339 deploy snippets, line 346 SSE-buffering note), and `mcp/README.md` if the new endpoint contract changes how MCP attributes ROI events.

---

## Key Findings Summary

- **MCP server is decoupled.** Imports only `chapters` from `cookbookData.ts` and ROI helpers from `roi-sidecar.js`. Both files survive the deletion. No coordination needed.
- **`api/src/functions/health.js` should probably stay.** Task brief lumps it with the LLM functions, but it has no LLM coupling and `Game.tsx:793` uses it to gate BlindArena live mode. Confirm intent before deleting.
- **Biggest task-#13 risk is unannounced.** Vite has no `base:` config and Wouter has no router base, so every hashed asset URL and every `<Link href="/..." />` is rooted at `/`. There are 11+ raw `window.location.href = "/..."` assignments. Subpath deployment will be a white screen until both Vite and Wouter are parameterized in step 1 above.
- **`openai` dep is cleanly removable.** Only 3 importers (`server/index.ts`, `api/src/functions/try-it.js`, `api/src/functions/chat.js`). MCP does not use it.
- **PS scripts ship in the release tarball** (`deploy.sh:18`). `start.ps1` and `install-service.ps1` are the operator paste-in path; stale env-var assignments there are silently misleading, not loudly failing. Replace, do not just delete.
