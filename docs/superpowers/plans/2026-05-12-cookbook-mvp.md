# Cookbook MVP — Implementation Plan

**Date:** 2026-05-12
**Branch:** `feat/cookbook-mvp` (worktree at `~/Projects/prompt-cookbook-gov-mvp/`)
**Status:** Approved, in execution via subagent-driven-development
**Author:** session controller (claude-opus 1M)
**Approved by:** Elliot Jarbe

---

## 1. Product framing

The cookbook stops being "another LLM passthrough." It becomes a **prompt quality tool** that teaches county staff to write better prompts, then hands the prompt off to Microsoft 365 Copilot or ChatGPT Enterprise to actually execute. The cookbook never generates county content.

The LLM is back in — narrowly. It evaluates, refines, and previews **prompts**. It does not answer factual questions about Manatee County, Florida law, or any specific topic. This is enforced by system prompt, RAG over chapter content, structured JSON outputs, and regex post-filtering.

### Reputational risk frame (the "screenshot defense")

Hallucination is not just a technical correctness problem — it is a credibility problem. Per the 2026-05-12 9 AM Matt discussion: *"I don't want us to lose credibility too soon. ... Funny is the worst part, right? If something if it comes back with something funny, somebody takes a screenshot."* Every technical control in this plan (domain-bound system prompts, keyword RAG, structured JSON outputs, regex post-filter, eval gate) exists to prevent the screenshot scenario. The eval gate (Task #10) is the explicit screenshot-defense gate before the AI Working Group demo. If a fixture would produce something a staff member could screenshot and laugh at, the eval fails and the build is blocked.

---

## 2. Architecture Decision Records

### ADR-001: Bound the LLM's domain to prompt-meta work
**Status:** Accepted. **Context:** Free-form LLM passthrough teaches staff to trust ungrounded model output for county facts. Commit `c1d876d` ("scrub fabricated stats") is evidence the failure mode shipped. **Decision:** LLM only critiques, refines, and previews prompts. System prompts hard-refuse county-content questions. Output schemas are JSON with named fields. Output regex strips fabricated-statute / dollar / ordinance patterns. **Consequence:** Hallucination cannot originate from cookbook content domain.

### ADR-002: Civic-ai governed proxy is the only LLM backend
**Status:** Accepted. **Decision:** Cookbook backend calls civic-ai `/v1/chat/completions` exclusively. The `openai` npm dep is removed. Model selection moves to civic-ai. Cookbook owns prompt construction + post-filtering; civic-ai owns governance + transport. **Consequence:** PII redaction + safety gates + audit + LLM-side breaker inherited.

### ADR-003: Deterministic keyword RAG, no embeddings for MVP
**Status:** Accepted. **Decision:** Keyword-scored retrieval over `cookbookData.ts` (title 10x, subtitle 5x, summary 3x, taskType 5x). Top 2-3 summaries + 1 full chapter injected per request. Reuses `mcp/server.ts` `searchChaptersImpl` scoring. **Consequence:** Zero new infra; revisit if synonym recall flagged in audit-sampling.

### ADR-004: Structured JSON outputs, zod-validated, no SSE prose streams
**Status:** Accepted. **Decision:** Every LLM call sets `response_format: { type: "json_object" }`. Server validates with zod. Validation fail → retry once with stricter system prompt; second fail → 502 + ROI event `success=false`. **Schemas:**
- `Critique`: `{ rtco: {role, task, context, output: 'present'|'weak'|'missing'}, anti_hallucination_clause: bool, specificity_issues: string[], suggestions: string[], cited_chapters: number[] }`
- `Refine`: `{ rewritten: string, applied_techniques: number[], notes: string }`
- `Preview`: `{ interpretation: string, gaps: string[], unclear: string[] }`

### ADR-005: Graceful degradation when civic-ai breaker opens
**Status:** Accepted. **Decision:** Builder stays fully functional in deterministic mode when the outer breaker opens — chapter browsing, RTCO entry, template loading, save-prompt, Send-to-Copilot all work. Critique/Refine/Preview buttons disable with tooltip "Coach feedback temporarily unavailable." Banner surfaces breaker state. **Consequence:** ~80% of cookbook value survives civic-ai outage.

### ADR-006: Send-to-Copilot is the only path to county-content generation
**Status:** Accepted. **Decision:** "Send to Copilot ↗" button copies prompt to clipboard + opens M365 Copilot Business Chat. If deep-link supported (Task #14 spike), uses it as progressive enhancement. Emits `TEMPLATE_EXPORT` ROI event. **Consequence:** Hallucination perimeter moves out of cookbook entirely.

### ADR-007: Civic-ai deploys on bcc-ap-infer01
**Status:** Accepted. **Context:** civic-ai uses `fcntl.flock()` for audit-log concurrency. Windows (llm01) has no fcntl. Civic-ai is platform infrastructure for the entire county AI mesh (cookbook, RLS Apex, future pilots), not a cookbook dep. **Decision:** Deploy on infer01 alongside qwen2.5-7b. Cookbook on llm01 calls civic-ai over the same network it already uses for inference. **Consequence:** Native Linux deploy; co-located with the slow hop (model inference); decouples cookbook fate from governance fate. **Risk:** Another service on the single-tenant prod GPU box — pin to non-GPU CPU cores, set OOMScoreAdjust to prefer killing civic-ai over sglang.

---

## 3. Target architecture

```
cookbook-web (Vite SPA, subpath-deployable)
   │ (via IIS reverse proxy on bcc-ap-llm01)
   │
   ▼
cookbook-node (Express, thin)
   ├── /api/health                        (kept, used by Game.tsx live-mode gate)
   ├── /api/critique  ┐
   ├── /api/refine    ┼── outer breaker ──► civic-ai on bcc-ap-infer01
   ├── /api/preview   ┘                     (PII redact, safety gates, audit,
   │                                         inner breaker → qwen2.5-7b localhost)
   └── /api/templates                      (read-only chapter data, no LLM)
       │
       └── ROI sidecar → manatee-ai-roi (PROMPT_CRITIQUE | PROMPT_REFINE | PROMPT_PREVIEW
                                          | TEMPLATE_EXPORT | LLM_CALL)

cookbook-mcp (separate stdio process)
   └── search_chapters, get_chapter, list_templates → deterministic chapter retrieval

External:
   M365 Copilot Business Chat ← Send-to-Copilot handoff (clipboard + new tab)
```

---

## 4. Circuit breaker (cookbook → civic-ai)

| Setting | Value |
|---|---|
| `errorThresholdPercentage` | 50 — open when >50% of calls fail in a 5-call rolling window |
| `volumeThreshold` | 5 |
| `reset_timeout_ms` | 30,000 |
| `call_timeout_ms` | 10,000 |
| `half_open_max_probes` | omitted (see note) |
| Excluded statuses (don't trip) | 400, 401, 403, 404, 422 |
| Fallback | Returns `{ __breaker_open: true }`; endpoints respond 503 + ROI event `success=false, reason=breaker_open` |

> **Note — `errorThresholdPercentage`:** Cannot use 100 — opossum uses strict `>` comparison, so a 100% failure rate would never trip the breaker. 50 with `volumeThreshold: 5` trips on >50% failure (3+ out of 5 calls).

> **Note — `half_open_max_probes` / `capacity`:** `capacity: 1` was a misspecification. opossum's `capacity` is a global semaphore that serializes ALL calls in EVERY state — not half-open single-probe enforcement. Half-open single-probe is enforced natively by opossum via its `PENDING_CLOSE` flag (see `node_modules/opossum/lib/circuit.js`). The `capacity` option was intentionally omitted from the implementation.

State machine: Closed → Open (>50% error rate over 5+ calls) → HalfOpen (after 30s) → Closed (probe success) or Open (probe fail). Single-probe enforcement matches the civic-ai inner-breaker pattern per Operating Rule #19.

---

## 5. Sequencing (per audit + SDD ordering)

The audit's 10-step pre-deletion checklist + new MVP work yields this execution order. Each step is one or more atomic commits.

**Phase A — Parameterize routing (no behavior change at `/`):**
1. Task #17 — Vite + Wouter + apiUrl() base support
2. Task #18 — migrate hardcoded `/paths` and `fetch("/api/...")` to use the new helpers

**Phase B — Stand up the new backend alongside the old:**
3. Task #1 — lock the three system prompts + JSON schemas
4. Task #2 — keyword chapter retrieval
5. Task #3 — wire civic-ai proxy (deploy civic-ai on infer01 first, separate work in civic-ai-deploy repo)
6. Task #4 — implement /api/critique, /api/refine, /api/preview
7. Task #5 — output regex post-filter (wired into #4)
8. Task #9 — ROI sidecar events on new endpoints

**Phase C — UI:**
9. Task #6 — Builder Critique panel
10. Task #7 — Builder Refine diff view
11. Task #8 — Builder Preview panel
12. Task #11 — Send-to-Copilot handoff (after #14 spike)

**Phase D — Validation gate:**
13. Task #10 — eval fixtures (5 per mode, 15 total)

**Phase E — Cut over:**
14. Task #19 — repoint 7 client fetch sites to new endpoints
15. Task #12 — delete legacy code per audit checklist (excludes `health.js`)

**Phase F — Deploy:**
16. Task #13 — IIS rewrite rules for subpath
17. Task #16 — `.github/` governance scaffolding

**Phase G — Content audit (parallel, blocks rollout not MVP code):**
18. Task #15 — persona PII audit (needs your AD/HR access)

---

## 6. Per-task details (for subagent dispatch)

### Task #17 — Vite + Wouter + apiUrl base support

**Acceptance criteria:**
- `vite.config.ts` has `base: process.env.VITE_BASE ?? "/"`
- `client/src/App.tsx` wraps routes in `<Router base={import.meta.env.BASE_URL.replace(/\/$/, "")}>`
- New file `client/src/lib/apiUrl.ts` exports `apiUrl(path: string): string` that prepends `import.meta.env.BASE_URL`
- `pnpm run build && pnpm start` at root still serves all pages correctly
- `pnpm run build` with `VITE_BASE=/cookbook/ pnpm run build` produces assets referencing `/cookbook/assets/...`
- One commit; small.

**Files:** `vite.config.ts`, `client/src/App.tsx`, `client/src/lib/apiUrl.ts` (new), one test if applicable.

**Tests:** Build verification (asset paths in `dist/index.html`).

### Task #18 — Migrate hardcoded paths

**Acceptance criteria:**
- Every `window.location.href = "/..."` replaced with Wouter `useLocation()` or relative nav.
- Every hardcoded `fetch("/api/...")` replaced with `apiUrl("/api/...")` helper.
- Zero behavior change at root path — every page renders, every fetch resolves.
- File:line refs from audit:
  - `client/src/components/TryItSection.tsx:109` — `window.location.href = "/builder"`
  - `client/src/components/ChapterDetail.tsx:915,1010` — `window.location.href = "/builder"`
  - `client/src/pages/Home.tsx:231,686` — `window.location.href = "/builder"`
  - `client/src/components/Sidebar.tsx:64,177,194,204,212,220`
  - All `fetch("/api/...")` in TryItSection.tsx:56, ChatbotWidget.tsx:53, Builder.tsx:688,1165, Game.tsx:724,793,1371
- Note: Game.tsx:793 fetches `/api/health` — keep that route alive.

**Tests:** Smoke at root: every nav link routes correctly, every fetch resolves to the existing routes.

### Task #1 — Lock system prompts

**Acceptance criteria:**
- Three system prompts in `server/prompts/critique.md`, `refine.md`, `preview.md`.
- Shared header forbids: factual questions about Manatee County, Florida statutes, county budgets, staff names, ordinance numbers, dates, dollar amounts. Cite chapters by NUMBER only, no paraphrasing beyond injected context.
- Per-mode trailing instructions specify JSON schema.
- Zod schemas defined in `server/schemas/{critique,refine,preview}.ts` matching ADR-004.
- One commit.

**Files:** `server/prompts/*.md` (3 new), `server/schemas/*.ts` (3 new).

### Task #2 — Keyword chapter retrieval

**Acceptance criteria:**
- New file `server/lib/chapter-retrieval.ts` exports `retrieveContext(query: string, topN = 3): { summaries: string[], fullChapter: Chapter }`.
- Scoring: title 10x, subtitle 5x, summary 3x, taskType 5x (matches `mcp/server.ts:searchChaptersImpl`).
- Reads chapters from a server-side import of `client/src/lib/cookbookData.ts` (acceptable cross-import; same as MCP server does it).
- Returns formatted markdown block ready to drop into system prompt.
- Unit tests: 3-5 queries with expected chapter IDs in results.

**Files:** `server/lib/chapter-retrieval.ts` (new), `server/lib/chapter-retrieval.test.ts` (new).

### Task #3 — Wire civic-ai proxy

**Acceptance criteria:**
- New env vars in `.env.example`: `CIVIC_AI_BASE_URL`, `CIVIC_AI_API_KEY`, `CIVIC_AI_DEFAULT_MODEL`.
- New file `server/lib/civic-ai-client.ts` exports `callCivicAi(messages, model, options): Promise<string>` using `fetch` (no openai client).
- New file `server/lib/breaker.ts` wraps `callCivicAi` with opossum per Section 4 config.
- `/api/health/breakers` endpoint returns `{ civic_ai: {state, failure_count, last_failure_ts} }`.
- Unit tests: breaker state transitions per Section 4.
- **Depends on:** civic-ai deployed on infer01 (separate work in `manatee-civic-ai-deploy` repo). For dev: civic-ai running locally is fine.

**Files:** `server/lib/civic-ai-client.ts`, `server/lib/breaker.ts`, `server/lib/breaker.test.ts`, plus update `.env.example`.

### Task #4 — Implement /api/critique, /api/refine, /api/preview

**Acceptance criteria:**
- Three POST routes in `server/index.ts` (or new `server/routes/llm.ts` if it stays cleaner).
- Each route: load mode system prompt + retrieve chapter context + assemble messages + call civic-ai via breaker + zod-validate response + apply regex post-filter (Task #5) + return.
- `temperature: 0.2` for critique/refine, `0.5` for preview. `max_tokens: 600`.
- On schema validation failure: retry once with stricter prompt. On second failure: 502 + ROI event `success=false`.
- ROI sidecar emits `PROMPT_CRITIQUE | PROMPT_REFINE | PROMPT_PREVIEW` per Task #9.
- New routes added ALONGSIDE existing /api/try-it and /api/chat. Old routes still work; they're deleted in Task #12 after Task #19 repoints all clients.
- Integration tests: 3 fixtures per mode hitting the live (or mocked) civic-ai endpoint.

**Files:** `server/routes/llm.ts` (or extend server/index.ts), `server/routes/llm.test.ts`.

### Task #5 — Output regex post-filter

**Acceptance criteria:**
- New file `server/lib/output-filter.ts` exports `filterOutput<T>(input: T, mode: 'critique'|'refine'|'preview'): { clean: T, flags: FilterFlag[], reject: boolean }` plus `FilterMode`, `FilterFlag`, `FilterResult` types. The function walks the input object recursively and scans every `string` value against the patterns; `clean` preserves the input's type via generic `T`. (Signature expanded from spec's original flat-string contract during Task #5 implementation — the generic shape is what Task #4 integrates against; `FilterFlag.field` carries the field path lost in a flat `string[]`.)
- Detects 4 patterns (case-insensitive, named consts):
  - `FLORIDA_STATUTE_RE` — `Fla. Stat. §...`, `F.S. ...`, `F.S.A. §...(N)` shapes
  - `DOLLAR_AMOUNT_LARGE_RE` — `$Xm`, `$X million`, `$XK`, `$XB` (not bare `$50`)
  - `ORDINANCE_SECTION_RE` — `Chapter X.Y`, `Section X.Y.Z`, `Ord. X.Y` (decimal required — bare `Chapter 13` is safe)
  - `FY_BUDGET_YEAR_RE` — `FYNNNN budget|appropriation|allocation|fund` (just `FY2025` alone is fine)
- For critique/preview: redact matches in `clean` as `[REDACTED:flag_name]`, populate `flags`, `reject = false`.
- For refine: do NOT redact (so the user's rewritten prompt has no `[REDACTED:...]` marks). Set `reject = true` if any flags fired. Endpoint code (Task #4) then retries once with a stricter prompt; second failure → 502.
- Schema-agnostic walker: pure (no mutation, uses `structuredClone`), handles arrays + nested objects + null/undefined gracefully, ignores non-string primitives.
- Unit tests: 8-10 fixture strings, each with expected flags + clean output — **CONDITIONAL on a test runner being configured.** No test runner exists as of Task #3; Task #10's eval gate provides indirect coverage via the per-mode JSON fixtures.

**Files:** `server/lib/output-filter.ts` (133 lines). Test file skipped per the conditional above.

### Task #9 — ROI sidecar events on new endpoints

**Acceptance criteria:**
- Emit `PROMPT_CRITIQUE`, `PROMPT_REFINE`, `PROMPT_PREVIEW` on respective endpoint completion (every path: 200, 400, 502, 503).
- Emit `LLM_CALL` per civic-ai breaker call (including retries — up to 4 per request on the refine filter-reject worst case).
- `TEMPLATE_EXPORT` from Send-to-Copilot handoff lands in Task #11 (client-side).
- Required fields per Operating Rule #18: event_kind, workflow=cookbook, user_id (from `iisaf-username` header), dept (`iisaf-dept`), role_band (`iisaf-roleband`), task_type, tool=cookbook, surface=web, duration_s, success. Fallbacks: `anonymous` / `unknown` / `professional`.
- task_type mapping: critique → `prompt_evaluation`, refine → `prompt_rewrite`, preview → `prompt_simulation`, LLM_CALL → `llm_inference`.
- Conditional `prompt_tokens` / `output_tokens` on LLM_CALL: **set to `0`** with a TODO. The SDK validator (`api/src/lib/roi-sidecar.js`) currently REQUIRES both fields non-null on every LLM_CALL — UNSET causes the event to be silently dropped. Until civic-ai-client.ts is expanded to expose `usage` from the response, `0` is the sentinel. Power BI dashboards will show `0` tokens on cookbook LLM_CALL rows until that lands.
- All emissions are fire-and-forget (`void emitEvent(...)`) — telemetry never blocks the user-facing response per Rule #18.
- trace_id (from `newTraceId()`) links each PROMPT_<MODE> event with its sibling LLM_CALL(s) — one trace per request.
- 503 emissions include `breaker_state: "open"` as an extra field.
- IIS forwarding of `iisaf-*` headers is a separate concern handled in Task #13 (subpath IIS rewrite rules). Until then, all requests fall back to defaults.
- Reuse existing `api/src/lib/roi-sidecar.js` SDK + add a `.d.ts` declaration for clean TypeScript imports.

**Files:** `api/src/lib/roi-sidecar.js` (add 3 EventKinds + `emitEvent` export), `api/src/lib/roi-sidecar.d.ts` (new — TypeScript declarations matching the JS public surface), `server/lib/roi-emit.ts` (new — `extractContext`, `emitPromptEvent`, `emitLlmCallEvent` helpers), `server/lib/llm-endpoints.ts` (modify — wire emits across all completion paths).

### Task #6 — Builder UI: Critique panel

**Acceptance criteria:**
- "Critique my prompt" button in Builder.tsx triggers POST to `apiUrl("/api/critique")` with current draft.
- Renders structured response: RTCO 4-pill checklist (role/task/context/output, each `present|weak|missing`), Specificity Issues list, Suggestions list (each suggestion clickable to apply to draft), Cited Chapters (clickable links to chapter pages).
- No prose surface — every field is a typed component.
- Loading state, error state, breaker-open state per ADR-005.
- Visual smoke via Servo screenshot before + after.

**Files:** Modify `client/src/pages/Builder.tsx`, possibly new `client/src/components/CritiquePanel.tsx`.

### Task #7 — Builder UI: Refine diff view

**Acceptance criteria:**
- "Refine using technique" dropdown lists chapter numbers + titles in Builder.tsx.
- On Apply: POST to `apiUrl("/api/refine")`, render side-by-side diff (use `diff` lib or similar).
- Accept replaces draft; Reject retains original.
- Shows `applied_techniques` chapter links.
- Visual smoke.

**Files:** Modify Builder.tsx, possibly new `client/src/components/RefineDiff.tsx`.

### Task #8 — Builder UI: Preview panel

**Acceptance criteria:**
- "Preview how this lands" button in Builder.tsx triggers POST to `apiUrl("/api/preview")`.
- Renders: Interpretation, Gaps list, Unclear list.
- Banner at top: "This is a simulation — actual results from Copilot or ChatGPT will vary."
- Visual smoke.

**Files:** Modify Builder.tsx, possibly new `client/src/components/PreviewPanel.tsx`.

### Task #11 — Send-to-Copilot handoff

**Acceptance criteria:**
- "Send to Copilot ↗" button in Builder.tsx.
- Copies final prompt to clipboard.
- Opens Copilot Business Chat in new tab.
- If Task #14 spike found a deep-link pattern: use it as progressive enhancement; else clipboard-only with on-screen instruction "Prompt copied — paste into Copilot."
- Emits `TEMPLATE_EXPORT` ROI event with `target_tool=copilot`.
- Visual smoke.

**Files:** Modify Builder.tsx, possibly new `client/src/lib/copilot-handoff.ts`.

### Task #10 — Eval gate (15 fixtures)

**Acceptance criteria:**
- New dir `tests/eval/{critique,refine,preview}/` with 5 JSON fixtures each.
- Each fixture: `{ input_prompt, expected_schema_keys, banned_tokens, applicable_chapters_min, applicable_chapters_max }`.
- Test runner: calls endpoint, asserts schema match, asserts no banned tokens in output, asserts chapter citation count in range.
- Wired into Azure Pipelines as required check.
- Block PR merge on failure.
- 5 representative fixtures per mode: include at least one prompt that asks for factual county content (model should refuse), one that's well-formed (model should commend), one missing RTCO components (model should flag specifically).

**Files:** `tests/eval/*.json` (15 new), `tests/eval/runner.ts`, pipeline YAML update.

### Task #19 — Repoint 7 client fetch sites

**Acceptance criteria:**
- TryItSection.tsx:56 — likely → /api/critique with chapter's tryItTemplate as draft prompt, OR delete the inline Try It section in favor of "Open in Builder" link. Decide.
- ChatbotWidget.tsx:53 — coach role moves to Builder hint system; this widget likely deletes entirely.
- Builder.tsx:688 (Run) — → /api/preview (was acting as a poor-man's preview anyway).
- Builder.tsx:1165 (Reverse-Engineer) — → /api/critique (asks "what would improve this prompt").
- Game.tsx:724 (BlindArena live) — → /api/preview (simulate the prompt).
- Game.tsx:793 (/api/health) — KEEP, no change.
- Game.tsx:1371 (Challenge submit) — → /api/critique (score the user's prompt).
- Each repointed call uses apiUrl() helper.
- Manual smoke each path before commit.

**Files:** `client/src/components/TryItSection.tsx`, `client/src/components/ChatbotWidget.tsx`, `client/src/pages/Builder.tsx`, `client/src/pages/Game.tsx`.

### Task #12 — Delete legacy (per audit steps 5-7)

**Acceptance criteria (in this order, atomic commits each):**
1. Delete `api/src/functions/try-it.js` and `api/src/functions/chat.js`. **DO NOT delete `health.js`.** Remove `"openai"` from `api/package.json`. Refresh `api/pnpm-lock.yaml`.
2. Delete from `server/index.ts`: `openai` import (line 5), `getOpenAIClient` (66-73), `requireLLM` (75-83), `streamCompletion` (88-144), `ALLOWED_MODELS` + `DEFAULT_MODEL` (149-155), `CHAT_SYSTEM_MESSAGE` (246-256), `app.post("/api/try-it", ...)` (218), `app.post("/api/chat", ...)` (257). Run `pnpm run check` (tsc --noEmit) to catch stragglers.
3. Remove `"openai"` from root `package.json`. Regenerate root `pnpm-lock.yaml`. Verify `pnpm install --frozen-lockfile` succeeds.
4. Update `.env.example`, `.env.local`, `start.ps1`, `install-service.ps1`: replace `COOKBOOK_LLM_*` with new `CIVIC_AI_*` env vars.
5. Doc sweep: update README.md and RUNBOOK.md per audit's step 10 file:line list.

### Task #13 — IIS rewrite rules for subpath

**Acceptance criteria:**
- `iis-setup.ps1` and `enable-auth.ps1` accept a `-BasePath` parameter (default `""` = root mount).
- `ReverseProxyToNode` rewrite rule maps `<base>/api/*` → `localhost:3000/api/*`.
- SPA fallback rewrites to `<base>/index.html` (relative to app, not absolute root).
- Smoke test: subpath mount under `/cookbook/` returns SPA at /cookbook/, API at /cookbook/api/health.
- Both PS scripts kept in lockstep per RUNBOOK:288 hazard.

### Task #14 — Copilot deep-link spike

**Status:** Background subagent dispatched, running. Outcome shapes Task #11.

### Task #16 — `.github/` governance scaffolding

**Acceptance criteria:**
- `.github/CODEOWNERS` requires **Matt + Keith + Chris** review on `client/src/lib/cookbookData.ts`, `client/src/pages/Resources.tsx`, `server/prompts/`, `mcp/`. (Per 2026-05-12 Matt meeting: *"I mean us. You know me Keith Chris you read through the the whole application and make sure ..."*. Add GitHub usernames once known; placeholder entries acceptable for the scaffold commit.)
- `.github/pull_request_template.md` with content checklist (source cited, URL alive, no real PII, persona labeled, banned-claims regex clean, ROI events tagged).
- `.github/workflows/content-checks.yml`: link-check (lychee or similar), banned-claims regex grep, JSON-schema validation on system prompts.
- Branch protection on `main` requires this workflow + 1 CODEOWNERS approval. (Documented in RUNBOOK; setting actual protection is a GitHub admin action.)

### Task #15 — Persona PII audit

**Acceptance criteria:**
- Cross-check 34 personas in `client/src/lib/cookbookData.ts` against county AD/HR directory (needs Elliot's access).
- If a persona matches a real employee: either (a) get written consent + retain, or (b) replace with explicitly-fictional name.
- Add a Resources page note: "Personas in this cookbook are fictional examples used for illustration."
- Blocks county-wide rollout, not MVP code.

---

## 7. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| LLM hallucinates prompt-engineering claims | Medium | Low | RAG citation requirement + chapter-number-only rule + Task #10 eval gate |
| Output JSON fails schema | Medium | Low | Retry once with stricter prompt; second fail → 502 + ROI event |
| Civic-ai not yet deployed on infer01 at endpoint integration time | Medium | Medium | Dev-loop civic-ai on Mac is acceptable for tasks #4-#10; county deploy is parallel work in manatee-civic-ai-deploy |
| Copilot deep-link unsupported (Task #14 negative result) | Medium | Low | Clipboard fallback is already adequate |
| Real-employee persona names ship to county | Low | **HIGH** (PII / public records) | Task #15 blocks rollout |
| Subpath build breaks asset URL | Medium | Medium | Task #17 verification at both `/` and `/cookbook/` before merge |
| ChatbotWidget removal breaks UX expectations | Low | Low | Coach role moves into Builder hints; document in CHANGELOG |

---

## 8. Definition of done

### Audience phasing (per 2026-05-12 Matt meeting)

- **Phase 1 — Internal demo to Matt:** target Friday **2026-05-15**. Refactored MVP shown end-of-week; Matt out Thursday morning, back Thursday afternoon + all day Friday.
- **Phase 2 — AI Working Group demo:** target **early June 2026** (next working-group meeting). Per Matt: *"if we're going to release this to the AI working group. It just need I think it needs to be focused."* This is the first non-author audience.
- **Phase 3 — County-wide rollout:** post-Working-Group sign-off. Not in scope for this plan.

### Done criteria (Phase 1 — Matt demo)

- All 16 tasks (1-16) + 3 new tasks (17, 18, 19) marked completed.
- Eval gate (Task #10) green on `feat/cookbook-mvp`.
- Pre-deletion audit (`docs/mvp-pre-deletion-audit.md`) all HIGH-risk items resolved.
- Final code review (per SDD `superpowers:finishing-a-development-branch`) approved by **Matt + Keith + Chris** per the named review trio.
- Manual smoke: Builder Critique + Refine + Preview + Send-to-Copilot work end-to-end against dev-loop civic-ai.
- Deploy guide updated in RUNBOOK.md.

### Done criteria (Phase 2 — Working Group demo)

- Persona PII audit (Task #15) signed off — blocks Working-Group exposure.
- IIS subpath deploy (Task #13) verified at `/cookbook/` under county hostname.
- Civic-ai deployed on bcc-ap-infer01 per ADR-007 (separate work in `manatee-civic-ai-deploy` repo).

---

## 9. References

- Pre-deletion audit: `docs/mvp-pre-deletion-audit.md`
- Copilot deep-link spike: `docs/spike-copilot-deeplink.md` (UNSUPPORTED — see Task #11)
- Stakeholder-alignment check: `docs/alignment-check-2026-05-12-matt.md` (verbatim cross-reference of plan against Matt meeting)
- Civic-ai repo: `~/Projects/manatee-civic-ai/`
- Civic-ai deploy repo: `~/Projects/manatee-civic-ai-deploy/`
- ROI sidecar SDK: `~/Projects/manatee-ai-roi/`
- Session memory: `~/.claude/projects/-Users-ejarbe/memory/project_prompt_cookbook_gov.md`

## 10. Phase-2 integration candidates (not MVP scope)

- **Matt's SharePoint Python module** — Matt's parallel work on a Python utility that downloads files from SharePoint and builds SharePoint pages from HTML. Could become the publishing pipeline for cookbook content updates post-MVP. Source: 2026-05-12 Matt meeting.
- **RAG over county knowledge base** — beyond MVP's chapter-content RAG, a future expansion could ground LLM responses in a county-specific KB (statutes index, org charts, policy docs) via MCP. Source: 2026-05-12 Matt meeting (Elliot proposed; Matt agreed but explicitly deferred from MVP).
