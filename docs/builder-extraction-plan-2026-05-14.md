# Builder Extraction Plan

**Date:** 2026-05-14
**Stage:** 3 of Cookbook MVP UX deep-dive
**Branch (cookbook):** `feat/cookbook-mvp` · **HEAD:** `516011d`
**New repo (planned):** `~/Projects/prompt-builder/` on `main`
**Author:** session controller (claude-opus 1M-context)
**Status:** Plan only — no code moved, no repo created. Executable by a follow-on SDD subagent.

---

## 0. Why this stage exists

Elliot's two constraints, verbatim:

1. *"I want the builder completely extracted from the cookbook to make it leaner."*
2. *"I don't have a problem with the separate repo for builder but when this goes into prod on the servers it needs to have the same cohesiveness and structure as you showed me earlier."*

Production deploy shape is fixed:

```
mcgpt.mymanatee.org/    (or www.mcgpt.com/)
├── /                   → portal (thin index)
├── /cookbook/          → cookbook SPA (this repo)
├── /builder/           → builder SPA (NEW repo, separate IIS Application)
└── /api/*              → shared backend (cookbook-node Express on llm01)
```

Same hostname, same brand, two SPAs that can ship independently.

---

## 1. Decision summary table

One row per question. The "Justify" column is one sentence. Full reasoning lives in §3.

| # | Question | Chosen option | Justify |
|---|---|---|---|
| Q1 | Repo structure | **Independent repos**, `~/Projects/prompt-builder/`. No submodule, no pnpm workspace. | Two-team-of-one cadence; Builder and Cookbook ship on different weeks; submodule + workspace add coupling we do not need. |
| Q2 | What moves to Builder | All Builder code paths + the four `ui/*` primitives + `ErrorBoundary` + `ThemeContext` + `utils.ts (cn)` (duplicated, see Q4). See §2 inventory. | Builder must be standalone; UI primitives are tiny and copy-cheap; ErrorBoundary + ThemeContext are required by BuilderApp.tsx. |
| Q3 | What stays in Cookbook | All `server/` code, `cookbookData.ts`, `departments.ts`, `personas.ts`, `tasteTests.ts`, `searchIndex.ts`, Portal app, MCP server, all cookbook pages. | Backend stays single (Q4 of the user's spec); cookbook data is cookbook-domain; portal is a thin landing not worth its own repo yet. |
| Q4 | Shared design tokens | **Duplicate `theme.ts` in both repos** (file-copy), with a contract test that hashes the file and fails if hashes drift. | County has no private npm registry today (open question O-1). Six-line tokens file changes ~quarterly; a hash gate prevents silent drift without monorepo overhead. |
| Q5 | Shared utility code (`apiUrl.ts`, `cn`) | **Duplicate** in both repos. | `apiUrl()` is 4 lines; `cn` is 3 lines; package overhead exceeds the code. Duplicate beats premature abstraction. |
| Q6 | Dev environment | Three terminals (or one `tmux` + a `pnpm dev:all` script per repo that uses `concurrently`). Express on `:3030`, Cookbook Vite on `:3001`, Builder Vite on `:3002`. Both Vites proxy `/api/*` → `:3030`. | Matches today's flow (cookbook dev already runs on `:3001` with `--host`). Operator can run one terminal per repo without coordination overhead. |
| Q7 | Builder gets chapter list for "Refine with technique" | **Server adds `GET /api/chapters/list`** returning `[{ id, number, title, summary }]`. Builder fetches at mount, caches in memory. | Single source of truth lives next to `chapter-retrieval.ts`; Builder is free of `cookbookData.ts` (1368 LOC) entirely. |
| Q8 | CI/CD | Two pipelines mirroring two repos. Cookbook CI builds **portal + cookbook + server** (drops `build:builder`). Builder CI builds **builder** only. Operator stages both artifacts under IIS at deploy time. | Independent release cadence is the whole point of separation; pipelines mirror repo boundaries. |
| Q9 | Migration sequence | 13-step checklist in §4. Builder repo skeleton first → copy files → wire shared concerns → dev-env parity → server endpoint → cut-over → delete from cookbook → bundle-size + visual baseline gates. | Order minimizes the window where Builder code exists in both repos and the worst-case rollback is `git revert` on the cookbook side. |
| Q10 | Risk + rollback | Five risks in §5; the load-bearing mitigations are the theme-hash contract test, the visual baseline, and the "Express keeps `/builder/*` static-fallback for one release after cut-over" safety net. | Rollback for a brand drift is "revert the theme copy"; rollback for a serve failure is "operator points IIS back at cookbook's `dist/builder/`." |
| Q-prod | Production serving of `/builder/*` (added per advisor flag) | **IIS mounts `/builder/` as its own Application pointing at Builder artifact.** Express drops `/builder` route as part of the cut-over. | Cleanest microservices boundary; Node is not in the static-serve path for Builder; matches "same hostname, separate IIS Application" pattern. Safety net: Express route stays in code (commented) for one release in case rollback is needed. |

---

## 2. Inventory — what moves, what stays, what duplicates

### Moves to `prompt-builder/`

**Pages**
- `client/src/pages/Builder.tsx` (1138 LOC, the big one)
- `client/src/pages/NotFound.tsx` — referenced by `BuilderApp.tsx`

**Components — Builder-exclusive**
- `client/src/components/CritiquePanel.tsx`
- `client/src/components/RefineDiff.tsx`
- `client/src/components/PreviewPanel.tsx`

**Components — shared infra (duplicate, see "Why duplicate")**
- `client/src/components/ErrorBoundary.tsx` — wraps `BuilderApp` and `CookbookApp`
- `client/src/components/ui/sonner.tsx` — Toaster
- `client/src/components/ui/tooltip.tsx` — TooltipProvider
- `client/src/components/ui/button.tsx` — only if Builder ends up importing; today it does not. Defer.
- `client/src/components/ui/card.tsx` — same as button. Defer.

**Contexts**
- `client/src/contexts/ThemeContext.tsx` — required by `BuilderApp.tsx`

**Lib (Builder-exclusive)**
- `client/src/lib/copilot-handoff.ts`
- `client/src/lib/pre-send-scan.ts` — does not exist yet; P0 patch from Stage-1 adversarial audit (`docs/adversarial-journey-2026-05-14.md` F1). Will live in Builder repo when implemented.

**Lib (duplicate, see Q4/Q5)**
- `client/src/lib/apiUrl.ts`
- `client/src/lib/utils.ts` (just the `cn` helper)
- `client/src/lib/theme.ts`

**Entry**
- `client/src/BuilderApp.tsx`
- Builder-flavored `client/src/main.tsx` (slimmed: only branches on `entry === "builder"` or falls back to BuilderApp directly — see migration step 6)

**Build infra**
- `vite.config.ts` (copied; trimmed to single bundle, no portal/cookbook/builder switching)
- `tsconfig.json`, `tsconfig.node.json` (copied)
- `vitest.config.ts` (copied — Builder gets its own test gate)
- `patches/wouter@3.7.1.patch` (copied — Builder uses wouter)
- `tailwind.config.*` and `client/src/index.css` (copied — Tailwind v4 has the config inline today; verify during step 2)
- `client/index.html` (copied — the bundle entry HTML)

**External dependencies that come with Builder** (verify exact versions during step 1)
- `@radix-ui/react-slot`, `@radix-ui/react-tooltip`
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `diff`, `framer-motion`, `lucide-react`
- `next-themes`, `sonner`, `wouter`, `zod`
- `react`, `react-dom` (19.2.5)
- Dev: `@tailwindcss/vite`, `@vitejs/plugin-react`, `tailwindcss`, `typescript`, `vite`, `vitest`, `@vitest/coverage-v8`, `prettier`, `pnpm`, `@types/*`

### Stays in cookbook repo

- All of `server/` (Express, civic-ai client, breaker, output-filter, schemas, prompts, roi-emit, llm-endpoints, chapter-retrieval, routes)
- `server/index.ts` — drops `/builder` static route in cut-over step 12. Keeps it commented out for one release as rollback insurance.
- `mcp/` (MCP server, stdio process — independent of Builder)
- `api/` (Azure Functions package — not Builder-related)
- All cookbook pages: `Home.tsx`, `Resources.tsx`, `Portal.tsx`, `Game.tsx`, `NotFound.tsx` (Cookbook keeps its own copy)
- All cookbook components: `ChapterDetail`, `HeroSection`, `Sidebar`, `RecipeCard`, `RecentlyViewed`, `DifficultyFilter`, `TryItSection`, `TasteTestModal`, `ImageLightbox`
- All cookbook lib: `cookbookData.ts`, `departments.ts`, `personas.ts`, `tasteTests.ts`, `searchIndex.ts`
- All cookbook hooks: `useComposition`, `useMobile`, `usePersistFn`, `usePersona`, `useRecentlyViewed`, `useTasteTests`
- Portal app: `client/src/PortalApp.tsx` (thin landing — stays in cookbook repo for simplicity per Q3)
- `.github/CODEOWNERS`, PR template, `content-checks.yml` workflow
- `deploy/`, `iis-setup.ps1`, `install-service.ps1`, `start.ps1`, RUNBOOK
- `azure-pipelines.yml` — modified to drop `build:builder` step

### Duplicate (lives in both repos, contract test for drift)

- `lib/theme.ts` — 78 LOC, oklch tokens
- `lib/apiUrl.ts` — 10 LOC
- `lib/utils.ts` — 7 LOC (`cn` helper)
- `components/ErrorBoundary.tsx` — small, hooked into `lib/utils.ts`
- `components/ui/sonner.tsx`, `components/ui/tooltip.tsx` — small shadcn wrappers
- `contexts/ThemeContext.tsx` — small

**Why duplicate, not shared package:**
1. County has no private npm registry today (Open Question O-1). `file:` workspace links require a parent monorepo, which contradicts the "independent repos" decision.
2. All seven files are <100 LOC each.
3. Drift is the only risk; a CI hash check in both repos catches drift in <1 minute.
4. If we later add a private registry (Verdaccio or GH Packages), promoting these to `@manatee-county/ui` and `@manatee-county/design-tokens` is a one-day refactor — both repos already import from `@/lib/...` aliases.

**TypeScript-pro lens — type-sharing for `Critique`, `Refine`, `Preview`:** Today `CritiquePanel.tsx` and `RefineDiff.tsx` carry comment `"Local type mirror of server/schemas/refine.ts"`. After extraction this duplication doubles (server schema in cookbook repo, two client mirrors in builder repo). **Decision:** accept the debt for MVP. Trigger to revisit: any time a server schema changes and the Builder client breaks at runtime instead of compile time. Recorded as Risk R5 in §5.

---

## 3. Architecture diagram

```mermaid
flowchart TB
    subgraph BCC-AP-LLM01["bcc-ap-llm01 (Windows / IIS)"]
        IIS["IIS Site: mcgpt.mymanatee.org<br/>(ARR + URL Rewrite)"]
        IIS_PORTAL["IIS App: / → wwwroot/portal"]
        IIS_COOK["IIS App: /cookbook → wwwroot/cookbook"]
        IIS_BUILDER["IIS App: /builder → wwwroot/builder<br/>(NEW, separate from cookbook)"]
        IIS_API["IIS App: /api → reverse-proxy to localhost:3000"]
        NSSM_NODE["NSSM: cookbook-node<br/>Express on :3000"]

        IIS --> IIS_PORTAL
        IIS --> IIS_COOK
        IIS --> IIS_BUILDER
        IIS --> IIS_API
        IIS_API --> NSSM_NODE
    end

    subgraph BCC-AP-INFER01["bcc-ap-infer01 (Linux / GPU)"]
        CIVIC["civic-ai :8100<br/>(governed LLM proxy)"]
        SGLANG["SGLang + Qwen2.5-7B-FP8 :30000"]
        ROI["manatee-ai-roi :8200<br/>(FastAPI ROI sidecar)"]
        CIVIC --> SGLANG
    end

    NSSM_NODE --"outer breaker → /v1/chat/completions"--> CIVIC
    NSSM_NODE --"ROI events"--> ROI

    subgraph DEV["Local dev (two repos, one operator)"]
        DEV_NODE["server/index.ts<br/>tsx watch :3030"]
        DEV_COOK["cookbook Vite :3001<br/>proxy /api → :3030"]
        DEV_BUILDER["builder Vite :3002<br/>proxy /api → :3030"]
    end

    subgraph REPOS["Source repos (independent)"]
        REPO_COOK["prompt-cookbook-gov-mvp/<br/>portal + cookbook + server + mcp"]
        REPO_BUILDER["prompt-builder/<br/>builder SPA only"]
    end

    REPO_COOK -."CI builds dist/portal + dist/cookbook + dist/server".-> IIS_PORTAL
    REPO_COOK -."".-> IIS_COOK
    REPO_COOK -."".-> NSSM_NODE
    REPO_BUILDER -."CI builds dist/".-> IIS_BUILDER

    style IIS_BUILDER fill:#cfe2ff,stroke:#0d6efd
    style REPO_BUILDER fill:#cfe2ff,stroke:#0d6efd
```

**Dev port topology** (after extraction):
- Express: `:3030`
- Cookbook Vite: `:3001` (was `:3000`; bumped to free `:3000` for `pnpm start` parity)
- Builder Vite: `:3002`
- Both Vites set `server.proxy = { "/api": "http://localhost:3030" }`

**CORS posture:**
- Dev: Express's existing `cors({ origin: true })` (non-prod branch) accepts both `:3001` and `:3002`.
- Prod: same hostname via IIS — same-origin, no CORS at all.

**ROI emit contract (Rule #18):**
- Builder's `sendToTarget` does `fetch("/api/roi/template-export", ...)` with a **relative URL**.
- Relative URL resolves to `:3002` in dev → Vite proxy → `:3030` → Express. In prod resolves to `mcgpt.mymanatee.org/api/...` → IIS reverse proxy → Express.
- **Do not change to absolute URL.** The relative form is load-bearing for both environments. (Flagged here so the SDD subagent does not "fix" it.)

---

## 4. Migration sequence

13 numbered steps. Each is small enough to be a single commit. The SDD subagent should execute in order and run the named gate after each.

| # | Step | Gate after step |
|---|---|---|
| 1 | **Create `~/Projects/prompt-builder/`** with: `package.json` (scoped to Builder deps from §2), `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts` (single bundle), `vitest.config.ts`, `.gitignore`, `README.md` (placeholder), `client/index.html`, empty `client/src/`, empty `tests/`. Initialize git, set `origin` to a new private repo on `jarbitechture` (and `azdo` second remote per Rule #17). | `git status` clean; `pnpm install` succeeds; `pnpm dev` shows blank page on `:3002` |
| 2 | **Copy duplicated files** from cookbook repo: `theme.ts`, `apiUrl.ts`, `utils.ts`, `ErrorBoundary.tsx`, `ThemeContext.tsx`, `ui/sonner.tsx`, `ui/tooltip.tsx`, `index.css`. Preserve paths under `client/src/`. Add `scripts/check-shared-files.sh` to both repos — script computes SHA-256 of each shared file and fails CI if hashes diverge between repos (the script takes a path arg pointing at the other repo's clone). | `pnpm exec tsc --noEmit` passes in Builder repo |
| 3 | **Copy Builder-exclusive code:** `pages/Builder.tsx`, `pages/NotFound.tsx`, `components/CritiquePanel.tsx`, `components/RefineDiff.tsx`, `components/PreviewPanel.tsx`, `BuilderApp.tsx`. **Do not modify imports yet** — let TypeScript fail loudly so we see every cross-cutting reference. | `pnpm exec tsc --noEmit` shows expected errors: missing `personas.ts`, missing `departments.ts`, missing `cookbookData.ts` |
| 4 | **Resolve `personas.ts` + `departments.ts` references in `Builder.tsx`.** Builder.tsx imports `personas`, `Persona`, `getDepartment`. Two paths: (a) **duplicate** both files (small; same drift-hash-test gate as §Q4), or (b) inline only the types Builder actually uses (department `id`, `name`, `icon`, `description`, `color`, `personalization.builderTemplate`). **Chosen:** duplicate both files. They are department/persona data, not cookbook-domain; Builder genuinely needs them for the personalization hero. Add hashes to `check-shared-files.sh`. | `pnpm exec tsc --noEmit` shows only `cookbookData.ts` missing |
| 5 | **Resolve `RefineDiff.tsx`'s `cookbookData.ts` import.** This is the only Builder file that imports `chapters` from `cookbookData.ts`. Replace with a typed fetch from the new endpoint (`GET /api/chapters/list` — defined in step 7). Add a `ChapterSummary` type at the top of `RefineDiff.tsx` (`{ id: string; number: number; title: string }`). Replace the `chapters.find(...)` calls with a state-held `chapters` array fetched once at component mount. | `pnpm exec tsc --noEmit` clean |
| 6 | **Simplify `main.tsx`.** Builder repo's `main.tsx` does not need to switch on `VITE_ENTRY` — there is only one entry. Reduce to: `import BuilderApp from "./BuilderApp"; createRoot(...).render(<BuilderApp/>)`. Drop the dynamic-import branching. | `pnpm dev` renders the full Builder UI on `:3002` |
| 7 | **In the cookbook repo, add `GET /api/chapters/list`** to `server/routes/` (new file `chapters-list.ts`). Returns `[{ id, number, title, summary }]` from `chapter-retrieval.ts` data. Add a vitest test. Wire into `server/index.ts`. Push to `feat/cookbook-mvp`. | `pnpm test` passes in cookbook repo; `curl localhost:3030/api/chapters/list` returns expected JSON |
| 8 | **Builder dev-env parity check.** With cookbook server running on `:3030` and Builder Vite on `:3002`: load `localhost:3002`, exercise full Builder flow: load template → fill blocks → Critique → Refine (with chapter selector) → Preview → Send-to-Copilot. Compare visually to current `:3001/builder` from cookbook repo. Capture Servo screenshots before and after for the side-by-side baseline. | All four LLM-backed flows return 200; visual diff vs. baseline shows no regression |
| 9 | **Vitest baseline.** Copy any Builder-related tests out of `tests/` in cookbook repo to Builder repo. Add a smoke test that mounts `BuilderApp` and asserts the welcome hero renders. | `pnpm test` green in Builder repo |
| 10 | **CI pipeline for Builder repo.** Copy + trim `azure-pipelines.yml` from cookbook — single build step `pnpm build`, single test step `pnpm test`, artifact = `dist/`. Push to `azdo` mirror. | First green CI run on `main` |
| 11 | **Cookbook repo: drop Builder code.** Delete in one commit: `pages/Builder.tsx`, `components/CritiquePanel.tsx`, `components/RefineDiff.tsx`, `components/PreviewPanel.tsx`, `lib/copilot-handoff.ts`, `BuilderApp.tsx`. Remove `entry === "builder"` branch from `main.tsx`. Remove `build:builder` from `package.json` scripts; remove `&& pnpm run build:builder` from the `build` script. Drop `diff` from dependencies (no longer used). | `pnpm build` succeeds in cookbook repo; `dist/` contains only `portal/`, `cookbook/`, and the server bundle |
| 12 | **Cookbook repo: drop `/builder` Express route.** In `server/index.ts`, comment out (do not delete yet) lines mounting `builderPath`. Leave a comment block referencing this plan doc and the rollback path (uncomment, redeploy). | `pnpm test` passes; `pnpm start` serves portal + cookbook only |
| 13 | **Update RUNBOOK + docs.** In cookbook repo, RUNBOOK.md gains a "Builder lives in a separate repo" section linking to the Builder repo URL. ADR-008 (new) records the extraction decision in `docs/adr/`. Update `docs/superpowers/plans/2026-05-12-cookbook-mvp.md` to note Builder is out of scope. **Open the cross-repo IIS deploy ticket** for the operator to add `/builder` as its own IIS Application. | This plan doc + ADR-008 pushed; ticket filed (location: wherever county tracks IIS work — note as Open Question O-2) |

**Suggested commit message for step 11** (the actual delete):
```
chore(extract): remove Builder code — moved to prompt-builder repo

Builder now lives in https://github.com/jarbitechture/prompt-builder
(and azdo mirror). This commit removes the duplicate code that has been
live in prompt-builder since step 8 of docs/builder-extraction-plan-2026-05-14.md.

The /builder Express route is commented (not deleted) for one-release
rollback insurance — see server/index.ts.
```

---

## 5. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Brand / token drift** between Cookbook and Builder. `theme.ts` is edited in one repo, the other gets stale; the two SPAs visually diverge under the same hostname. | High over 6+ months | Medium (visible to county staff) | `check-shared-files.sh` SHA-256 gate in **both** repos' CI. Drift = red CI on the repo that did not update. Pre-deploy Servo visual baseline diffs `wwwroot/cookbook/index.html` vs. `wwwroot/builder/index.html` for the chrome strip. |
| R2 | **`/api/*` contract drift** — Builder repo evolves its `Critique` / `Refine` / `Preview` types independently from cookbook server's zod schemas; runtime parse fails instead of compile error. | Medium | High (Builder breaks silently in prod) | Two layers: (a) zod returns useful errors today and the client shows toast; (b) ADR-009 to be written — "API versioning: every breaking change to a schema bumps the route path (`/api/v2/critique`)." Trigger to write ADR-009: first time a schema field changes after extraction. |
| R3 | **Dev-environment setup regresses** for a new contributor (or future Elliot after a context break). Three terminals × two repos × Vite proxy config is more friction than one repo. | Medium | Low (Elliot only contributor today) | Add `RUNBOOK_DEV.md` to **both** repos. In each, a `pnpm dev:all` script using `concurrently` starts the local stack from a single command (the cookbook repo's `dev:all` also starts the Builder repo's dev server if the sibling directory exists). |
| R4 | **Bundle size regression after extraction** — Builder repo pulls in framer-motion, diff, sonner, etc.; if tree-shake is misconfigured (e.g. via wrong tailwind v4 config copy in step 1), Builder ships a fatter bundle than its current portion of cookbook. | Low | Medium | Step 8 captures a baseline; CI in Builder repo asserts `dist/*.js` total < 600KB gzip (current Builder slice is ~280KB gzip from `pnpm build` in cookbook). Hard-fail the build if exceeded. |
| R5 | **Type-mirror duplication accelerates** — `Critique` / `Refine` / `Preview` types now exist in three places (server schemas, cookbook never imports them, Builder mirrors twice — once in `CritiquePanel`, once in `RefineDiff`). | High over 6+ months | Medium (silent client-side breakage) | Accepted debt for MVP. Trigger to fix: any schema-side change that escapes client awareness. Fix path: extract `@manatee-county/api-contracts` package from zod (`zod-to-ts`) — same registry constraint as R1. |
| R6 | **Cross-repo IIS deploy ticket falls through** the operator's queue, and `/builder` is served only from Express's commented-but-not-deleted route. Cut-over step 12 is then load-bearing in a way it should not be. | Low | High (Builder offline after route is deleted in next release) | The route stays commented (not deleted) for a full release cycle after extraction. ADR-008 explicitly names "remove Express `/builder` route" as the gating condition for the **second** release after extraction. Operator owns IIS Application creation before that release. |

---

## 6. Effort estimate

| Phase | Steps | Hours |
|---|---|---|
| Repo skeleton + duplicated files | 1, 2 | 1.0 |
| Copy + de-couple imports | 3, 4, 5, 6 | 2.5 |
| Server endpoint (`/api/chapters/list`) | 7 | 1.0 |
| Dev-env parity validation + Servo baseline | 8 | 1.0 |
| Test baseline | 9 | 0.5 |
| Builder CI pipeline | 10 | 1.0 |
| Cookbook cleanup (route comment, code delete, package.json) | 11, 12 | 1.0 |
| RUNBOOK + ADR-008 + ticket | 13 | 1.0 |
| **Total** | | **9.0** |

Rough budget: **one focused day** for a single SDD subagent operator. Add 0.5h for the IIS-side operator (separate from this plan) to mount `/builder` as its own Application.

---

## 7. Open questions for Elliot

| ID | Question | Why it matters | Decision deadline |
|---|---|---|---|
| O-1 | Does Manatee County have (or want) a private npm registry? Verdaccio, GH Packages, ADO Artifacts? | If yes, R1 + R5 collapse to "publish `@manatee-county/design-tokens` + `@manatee-county/api-contracts`" — three-hour future task. If no, the duplicate-with-hash-gate approach in Q4 is the right MVP play. | Before any post-extraction iteration; not a blocker for this plan. |
| O-2 | Who owns the IIS configuration change to mount `/builder/` as its own Application? Where is the operator's ticket queue? | Step 13 needs to land somewhere. If Elliot does it, the plan can name him. If county IT operator does it, this gates the final cut-over. | Before step 13. |
| O-3 | Repo naming: `prompt-builder` (proposed) or `manatee-prompt-builder` (matches county-prefix convention some other repos use)? | Naming once is cheap; renaming after CI + IIS + bookmarks lock in is not. | Before step 1. |
| O-4 | The portal app (`PortalApp.tsx`) — does it stay in the cookbook repo permanently, or get its own repo in a future stage? | Plan assumes **stays in cookbook**. If portal grows into its own product, revisit in Stage 4 or 5. Not a blocker. | Not a blocker — flag only. |
| O-5 | Should Stage-1 audit's F1 PII pre-flight (`pre-send-scan.ts`) ship into cookbook first (and then move to Builder), or wait for Builder repo to exist? | If cookbook ships F1 before extraction, Builder inherits it on copy (step 3). If Builder repo lands first, F1 goes straight into Builder. The faster ship is whichever is closer to ready. | Before Friday demo (per adversarial audit timeline). |

---

## 8. What the SDD subagent should NOT decide on its own

These are explicit guardrails so the next agent does not silently change architecture:

1. Do not change `apiUrl()` to use an absolute URL or env var — the relative form is load-bearing for both dev (Vite proxy) and prod (same-hostname IIS). See §3 ROI emit contract.
2. Do not promote duplicate files into a shared workspace package without resolving O-1.
3. Do not delete the `/builder` Express route in step 12 — comment only. Deleting waits for the second release after extraction (R6).
4. Do not move `personas.ts` or `departments.ts` to a shared package without resolving O-1. Duplicate per Q4 / step 4.
5. Do not rename routes (`/api/critique` etc.) — Builder client expects the existing paths.

---

## 9. Lens checklist (per Stage-3 instructions)

- **microservices-architect** — applied at Q-prod (IIS Application boundary), Q1 (repo boundary), R2 (API versioning trigger), §8 guardrails (route stability).
- **ui-design-system** — applied at Q4 (theme tokens), R1 (drift gate + Servo visual baseline), Q2 (which `ui/*` primitives move).
- **typescript-pro** — applied at R5 (type mirror accumulation), step 4 (typing department personalization), step 5 (typed `ChapterSummary` for the new endpoint).
- **web-design-guidelines** — applied at §3 (same-hostname cohesion), R1 (cross-repo brand drift), step 8 (Servo side-by-side baseline).
