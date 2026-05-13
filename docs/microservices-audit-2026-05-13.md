# Microservices Architecture Audit — Cookbook MVP

**Date:** 2026-05-13
**Branch:** `feat/cookbook-mvp` @ `52a9948` (HEAD)
**Auditor:** microservices-architect skill (Opus 4.7 1M)
**Scope:** cookbook-web + cookbook-node + cookbook-mcp + the two upstream platform services it talks to (civic-ai, manatee-ai-roi). Pre-Task-#12 half-deleted state — old `/api/try-it` and `/api/chat` routes still coexist with new coach routes.

---

## 1. Boundaries diagram

```mermaid
flowchart TB
    subgraph browser["Browser (county staff workstation)"]
        SPA["cookbook-web (Vite SPA)<br/>Owned data: in-memory UI state only"]
    end

    subgraph llm01["bcc-ap-llm01 (Windows / IIS / NSSM)"]
        IIS["IIS reverse proxy<br/>(ARR + SPA fallback)"]
        NODE["cookbook-node (Express)<br/>POST /api/critique<br/>POST /api/refine<br/>POST /api/preview<br/>GET  /api/health<br/>GET  /api/health/breakers<br/>POST /api/try-it    [LEGACY — pending Task #12 delete]<br/>POST /api/chat      [LEGACY — pending Task #12 delete]<br/>Owned data: in-process rate-limit buckets, breaker stats, prompt cache"]
    end

    subgraph user_workstation["Per-user (stdio process spawned by Copilot / ChatGPT Enterprise)"]
        MCP["cookbook-mcp (stdio)<br/>search_chapters, get_chapter<br/>Owned data: NONE (read-only access to chapter content)"]
    end

    subgraph infer01["bcc-ap-infer01 (Linux / planned per ADR-007)"]
        CIVIC["civic-ai FastAPI proxy<br/>POST /v1/chat/completions<br/>GET  /health<br/>GET  /v1/models<br/>Owned data: audit log (fcntl-locked JSONL), inner breaker state, rate-limit buckets"]
        SGLANG["sglang / qwen2.5-7b-fp8<br/>(localhost on infer01)<br/>Owned data: model weights"]
    end

    subgraph roi_host["FastAPI host (manatee-ai-roi)"]
        ROI["manatee-ai-roi FastAPI<br/>POST /v1/events<br/>Owned data: ROI event store"]
    end

    subgraph fs["Local FS (per emitting host)"]
        JSONL["~/.cache/manatee-ai-roi/<br/>fallback.jsonl (append-only)"]
    end

    subgraph content["Content package — shared at build time"]
        DATA["client/src/lib/cookbookData.ts<br/>(34 chapters, 34 personas)"]
    end

    M365["M365 Copilot Business Chat<br/>(external SaaS)"]

    SPA -->|sync HTTP via IIS proxy| IIS
    IIS -->|localhost:3000| NODE
    NODE -->|sync HTTPS| CIVIC
    CIVIC -->|localhost HTTP| SGLANG
    NODE -.->|fire-and-forget POST<br/>(circuit-broken, JSONL fallback)| ROI
    NODE -.->|append on breaker open| JSONL
    JSONL -.->|background drain on recovery| ROI
    MCP -->|stdio JSON-RPC| user_workstation
    MCP -.->|fire-and-forget POST| ROI
    SPA -.->|clipboard + new tab handoff| M365

    DATA -.->|build-time embedded| SPA
    DATA -.->|build-time embedded| NODE
    DATA -.->|build-time embedded| MCP

    classDef legacy stroke:#c00,stroke-dasharray: 5 5
    classDef shared fill:#ffd
    class DATA shared
```

Key boundary facts:

- **Three deployable units** (cookbook-web, cookbook-node, cookbook-mcp) embed the same `cookbookData.ts` build-time module. This is shared *read-only content*, not a shared mutable schema.
- **No service-to-service async edges.** The only fire-and-forget edges are ROI emissions, which the SDK serialises behind a per-host JSONL fallback queue.
- **Civic-ai is platform infrastructure, not a cookbook dep** (ADR-007). The cookbook is one of N consumers (RLS Apex v1, future pilots, etc.).
- **manatee-ai-roi is platform infrastructure**, same shape.

---

## 2. Per-step findings

| # | Step | Status | Evidence (file:line) | Recommendation |
|---|---|---|---|---|
| 1 | Domain analysis (DDD) | **PASS with one watch-item** | `mcp/server.ts:32` + `server/lib/llm-endpoints.ts:34` both import `chapters` from `client/src/lib/cookbookData.js`. Each of the three services owns its own data otherwise (rate-limit buckets, breaker stats, audit log, ROI event store). | Promote `cookbookData.ts` to a versioned content package (see ADR-CB-001 below). Today it's already CODEOWNERS-gated per Task #16, but the rebuild-coupling needs to be explicit. |
| 2 | Communication design | **PASS** | All inter-service calls are sync request/response (`server/lib/civic-ai-client.ts:58`, `server/lib/llm-endpoints.ts:140 breaker.fire(...)`). ROI emission is fire-and-forget (`server/lib/roi-emit.ts:80 ...spread`, `api/src/lib/roi-sidecar.js:339 void dispatch(event)`). | Stay sync for critique/refine/preview — user is waiting for output, sub-30s SLA, no cross-aggregate writes. Async messaging (Kafka/RabbitMQ) would add operational load with no payoff. Do not introduce it. |
| 3 | Data strategy | **PASS** | Cookbook owns no persistent state at runtime — rate buckets and breaker counters are in-process and rebuild-on-start. Civic-ai owns the audit log (`fcntl`-locked JSONL — per ADR-007 the reason for Linux-only deploy). manatee-ai-roi owns the event store. No shared database, no cross-service joins. | Keep stateless-at-rest property when cookbook horizontally scales (Phase-2 consideration — see §5). Rate-buckets becoming a shared concern when there's more than one Node process is the only forward-looking risk. |
| 4 | Resilience | **NEEDS WORK** | Outer breaker (`server/lib/breaker.ts:29-52`) wired against civic-ai. Inner breaker (civic-ai → sglang) inherited per ADR-002. ROI sidecar has its own breaker (`api/src/lib/roi-sidecar.js:75-119`) with 5-failure-30s-cooldown. **Gap 1:** the ROI breaker state is NOT exposed by `GET /api/health/breakers` (`server/index.ts:220` returns only `{civic_ai: ...}`). **Gap 2:** no timeout configured on civic-ai `/v1/models` or `/health` calls (not used at runtime today, but if added). **Gap 3:** refine worst-case retry chain (`llm-endpoints.ts:362,378,404,446`) can fire 4 civic-ai calls per user action — chatty under degraded conditions. | (a) Expand `/api/health/breakers` to include `{civic_ai, roi_sidecar}`. (b) Add an overall retry budget per refine request — cap at 2 upstream calls regardless of which failure path fires. (c) Document max worst-case user-facing latency at 4 × 10s call timeout = 40s; consider cutting `call_timeout_ms` to 8s. |
| 5 | Observability | **GAP** | `trace_id` is generated per request (`llm-endpoints.ts:176,286,497`) and stamped on both PROMPT_<MODE> and LLM_CALL ROI events. **However**, the trace_id is NEVER propagated to civic-ai: `civic-ai-client.ts:51-56` sets only `Content-Type` and `Authorization` headers. Civic-ai's audit log (`audit.log_event` in `manatee-civic-ai/api_server.py`) records the request with its own correlation key (client_ip + timestamp) and CANNOT be joined to cookbook ROI rows for the same user action. This is the explicit Step-5 validation checkpoint failure: a request cannot be traced end-to-end across both services. No centralised logging — cookbook logs go to NSSM stdout/stderr, civic-ai logs go to local audit JSONL, ROI events go to the ROI store. | **P1 fix:** propagate `traceparent` (W3C) header from `civic-ai-client.ts` and have civic-ai stamp it on every `audit.log_event` row. Schema work is on the civic-ai side; one-line header addition on the cookbook side. See ADR-CB-002 below. |
| 6 | Deployment | **NEEDS WORK** | NSSM (Windows service manager) provides process-liveness monitoring only — no HTTP probing. IIS ARR does passive failure detection only (no active health check). `/api/health` and `/health` exist (`server/index.ts:215`, civic-ai `api_server.py:243`) but **nothing in the deploy stack actively calls them on startup or during operation**. Health probes are defined but unused. No container orchestration (K8s, ECS) — defensible at county scale (single-tenant, sub-100 RPS expected). No service mesh — defensible at three services. No progressive delivery (canary, blue-green); deploy is paste-the-tarball + NSSM restart. | (a) Add `Test-NetConnection`+`Invoke-WebRequest /api/health` to `install-service.ps1` and `start.ps1` as a post-start smoke. Fail the install if the endpoint isn't 200 within 30s. (b) Document a manual canary path for Phase 2: deploy to a `cookbook-canary` IIS app alias, smoke against it, then swap. K8s is overkill for current scale. |

---

## 3. Risk register (ranked by blast radius)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **End-to-end trace broken at cookbook→civic-ai seam.** A staff-reported hallucination cannot be correlated to a civic-ai audit row, blocking root-cause analysis for the screenshot scenario the eval gate is designed to prevent. | High (already true today) | High — defeats the post-incident defensibility the governance proxy exists to provide | Add `traceparent` header propagation in `civic-ai-client.ts:51-56`; have civic-ai stamp it on `audit.log_event`. One PR per side. (ADR-CB-002.) |
| R2 | **Single point of failure: civic-ai on infer01.** Single-tenant prod GPU box. If sglang OOMs and starves civic-ai, every cookbook coach button degrades to 503 simultaneously. ADR-007 already flags this but the cookbook-side mitigation (breaker + deterministic fallback per ADR-005) hides the symptom from users without alerting ops. | Medium | High — silent degradation of the demo-critical feature surface | (a) Wire `/api/health/breakers` to a uptime monitor (UptimeRobot, Datadog Synthetics, or even a Power BI tile) with paging on `state=open`. (b) Add a logged warning every N seconds while the breaker is open, not just on transitions. (c) Phase-2: add a second civic-ai replica on a separate host pinned to a CPU-only model fallback. |
| R3 | **Half-deleted legacy state.** HEAD is at Task #10 (eval gate); Task #12 (delete `/api/try-it`, `/api/chat`, `openai` dep, `COOKBOOK_LLM_*` vars) has not shipped. `server/index.ts:5,68-83,151-157,225,264` still alive. Client still calls the old routes from 7 sites per pre-deletion audit. If a deploy ships before Task #19 + Task #12 land, two LLM backends are reachable simultaneously — one governed, one not. Reputational risk is exactly the screenshot scenario the eval gate is supposed to prevent. | Medium (one bad merge order) | High — bypasses every governance control the MVP is built around | Block any production deploy until Task #19 and Task #12 land. Add a CI guard: fail the build if `OpenAI` or `COOKBOOK_LLM_` is present in `server/index.ts` (Task #16 governance scaffolding is the right home for it). |
| R4 | **Versioning gaps on all three inter-service contracts.** (a) `civic-ai-client.ts:58` POSTs to `/v1/chat/completions` — `/v1` is in the base URL but no `Accept-Version` and no fail-closed shape check on `data.choices[0].message.content` beyond `typeof === "string"` (`civic-ai-client.ts:73-79`). (b) `roi-sidecar.js:194` POSTs to `/v1/events`; schema version 1.2.0 lives in a comment (`roi-sidecar.js:30`). If manatee-ai-roi bumps to 2.0, every event silently fails validation upstream and queues forever in JSONL. (c) MCP `server.ts:75` declares `version: "0.1.0"` but tool input schemas are unversioned. | Medium | Medium — silent data loss; debugging starts from "the dashboard tile is zero" | Add a `version` query param or `Accept-Version` header to every cross-service POST. Make the contract version a runtime field, not a comment. Civic-ai and manatee-ai-roi should both return 410 Gone or 426 Upgrade Required when a stale version is sent. (ADR-CB-003.) |
| R5 | **Deploy-time misconfiguration on `CIVIC_AI_BASE_URL`.** `.env.example:22` and the `server/lib/civic-ai-client.ts:9` default both point to `http://127.0.0.1:8100/v1`. On llm01 calling infer01 this MUST be overridden. The cookbook ships before civic-ai is deployed on infer01 — operators paste `.env.local` from the tarball without thinking. NSSM holds the stale env value until `install-service.ps1` reruns. | Medium (operator paste) | Medium — cookbook 503s with `breaker_state=open` until reconfigured; recoverable in minutes | (a) Move the production default in `.env.example` to a placeholder like `https://civic-ai.county.internal/v1` so the loopback is dev-only. (b) Add a startup self-check that POSTs an empty messages payload to civic-ai `/v1/models` and refuses to bind port 3000 on failure. (c) Document this in RUNBOOK §deploy section. |

---

## 4. ADR candidates

Four ADRs worth recording — drop into `docs/adr/` as numbered stubs.

### ADR-CB-001: cookbookData.ts is a versioned content package, frozen post-rollout

**Status:** Proposed. **Context:** Three deploy units (web bundle, cookbook-node, cookbook-mcp) build-time embed `client/src/lib/cookbookData.ts`. A change to one chapter or persona requires rebuild + redeploy of all three. The pre-deletion audit notes this as an "acceptable cross-import" (line 188 of plan doc). In microservices terms it is a shared embedded read-only dataset — fine at MVP scale, but only if the content version is explicit and the change path is governed. **Decision:** Treat `cookbookData.ts` as a versioned content package with a top-level `export const COOKBOOK_CONTENT_VERSION = "1.0.0"` constant. Bump per chapter or persona edit. CODEOWNERS gates every change (Matt + Keith + Chris per Task #16). All three services log the loaded version on startup. **Consequence:** Version drift between deploy units becomes a logged fact instead of an invisible coupling.

### ADR-CB-002: W3C traceparent propagates across every cross-service hop

**Status:** Proposed. **Context:** Step 5 of this audit fails: cookbook generates `trace_id` (`llm-endpoints.ts:176`) and stamps it on ROI events, but the header never reaches civic-ai. Civic-ai's audit log uses its own correlation key. Joining a screenshot-reported hallucination back to its civic-ai audit row is currently impossible. **Decision:** Cookbook propagates a W3C `traceparent` header on every civic-ai call. Civic-ai parses it and includes the trace_id in every `audit.log_event` row. ROI events from both sides share the same trace_id. **Consequence:** Single request traceable end-to-end across cookbook → civic-ai → audit log → ROI store. The validation checkpoint for Step 5 passes. **Cost:** One-line change on cookbook side (`civic-ai-client.ts`), schema change on civic-ai side (audit log row + optional Pydantic model update).

### ADR-CB-003: Every inter-service contract carries an explicit runtime version

**Status:** Proposed. **Context:** Three contracts (cookbook → civic-ai, cookbook → manatee-ai-roi, MCP tool schemas) are versioned only by comment or by URL prefix. A schema bump on either platform service silently drops cookbook events into the JSONL fallback. **Decision:** Every cross-service request includes an `Accept-Version` (or equivalent query param) declaring the schema version the caller speaks. Servers return 426 Upgrade Required on mismatch. **Consequence:** Schema drift fails loudly. Backwards-incompatible bumps require coordinated deploy, but the discovery happens at deploy time, not at next-month dashboard review.

### ADR-CB-004: No async messaging, no service mesh, no K8s for MVP — explicit rejection

**Status:** Proposed. **Context:** Microservices best practice often defaults to Kafka/RabbitMQ and a service mesh. This audit explicitly rejects both for the cookbook. **Decision:** (a) All user-facing service-to-service calls are sync HTTP. The only async path is ROI emission, already implemented as fire-and-forget with per-host JSONL fallback. No message broker. (b) No service mesh (Istio, Linkerd). Three services + one passive proxy don't justify the operational tax. (c) No Kubernetes. NSSM on Windows + systemd on Linux is the deploy target. **Consequence:** Lower operational burden, fewer failure modes to debug, faster onboarding. **Revisit if:** RPS exceeds 100 sustained, OR the service count exceeds six, OR the first cross-aggregate write appears (none today — every coach call is read-only against `cookbookData.ts`).

---

## 5. Phase-2 recommendations

Beyond MVP, the moves that would harden this for county-wide rollout:

1. **Active health probing.** Replace NSSM-only liveness with a sidecar `cookbook-healthcheck` task (a 30-line PowerShell or a separate NSSM service) that hits `/api/health/breakers` every 15s and logs to the event log. Page on `civic_ai.state=open` for >5 minutes.
2. **Second civic-ai replica.** Phase-2 ROI defense requires civic-ai uptime; today it's a single Linux box. Add a CPU-only replica (smaller, slower model) as a cold standby. Cookbook breaker fallback already returns deterministic mode; the second replica would be the *step before* full deterministic fallback.
3. **Audit-log + ROI store join.** Once ADR-CB-002 is shipped (trace_id propagation), build a Power BI tile that joins civic-ai audit rows + manatee-ai-roi events on trace_id. This is the dashboard that defends the renewal narrative: every reported hallucination is traceable to a specific civic-ai request, with the full input message visible in the audit log.
4. **Rate-bucket externalisation.** When cookbook scales beyond one Node process (probably won't at county scale, but if it does), the in-process rate buckets become per-instance. Move to Redis or a shared file. NOT needed for MVP — flag for Phase 3.
5. **Content version dashboard.** Tile showing the `COOKBOOK_CONTENT_VERSION` from each of the three deploy units (web, node, mcp) so version drift is visible. Drift detection > prevention.
6. **MCP server distribution path.** MCP server is per-user today (each staff member installs into their ChatGPT/Copilot tool config). At county scale this is high-friction. Phase-2 candidate: ship a county-managed MCP gateway that proxies to the cookbook MCP server, with `iisaf-username` from IIS auth replacing the env-var identity.

---

## 6. Appendix — what passed without finding

To save the next auditor a re-read, these were checked and are clean:

- **Outer breaker config** (`server/lib/breaker.ts:34-39`) — thresholds, timeout, error filter all match plan §4. Half-open single-probe handled natively by opossum's `PENDING_CLOSE` flag.
- **Fire-and-forget telemetry** (`server/lib/roi-emit.ts:62,101`) — `emitPromptEvent` and `emitLlmCallEvent` are sync void; dispatch happens behind `void dispatch(event)` in `roi-sidecar.js:339`. Telemetry never blocks user-facing response (Operating Rule #18).
- **Schema validation + retry policy** (`server/lib/llm-endpoints.ts:240-267,399-424,560-585`) — one retry with stricter prompt on JSON-parse or zod failure, second failure → 502. ROI events emit on every path.
- **Excluded statuses on the breaker** (`server/lib/breaker.ts:27`) — 400, 401, 403, 404, 422 do not trip; matches the principle that deterministic client errors should not gate infrastructure availability.
- **ROI sidecar breaker semantics** (`api/src/lib/roi-sidecar.js:92-119`) — closed/open/half-open state machine, 5-failure threshold, 30s cooldown, fallback JSONL, background drain on recovery. A+ architecture per memory log.
