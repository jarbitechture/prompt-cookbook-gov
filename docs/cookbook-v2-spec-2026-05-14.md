# Cookbook v2 Strip-Back — Specification

**Date:** 2026-05-14
**Stage:** 4 of UX deep-dive (spec only — no code execution)
**Branch:** `feat/cookbook-mvp` · **HEAD when written:** `047102a`
**Author:** session controller (claude-opus 1M-context, with cs-content-creator + frontend-ui-ux + ui-design-system + cs-ux-researcher + architecture-designer lenses applied)
**Status:** Authoritative — Elliot's Q1–Q8 answers are locked. Each task below is SDD-dispatchable.

**Inputs consumed:**
- `docs/cookbook-audit-2026-05-14.md` (Stage 2 content/code audit)
- `docs/adversarial-journey-2026-05-14.md` (Stage 1 adversarial findings)
- `docs/builder-extraction-plan-2026-05-14.md` (Stage 3 — bundle-aware coordination)

---

## 1. Executive summary

**Surface to remove (approx.):** ~2,750 lines deletable / ~250 lines refactored

| Category | Lines | Notes |
|---|---|---|
| Game.tsx — Arena + Anatomy + ModeSelection + ChallengeMode | ~1,650 | Net delete after Capstone+critique absorbed into Builder |
| `tasteTests.ts` + `useTasteTests.ts` + `TasteTestModal.tsx` | ~380 | Full deletion |
| `cookbookData.ts` — ch17 / ch18 / ch19 / ch22 | ~190 | 4 chapter blocks |
| Tier badge UI in Home.tsx + Sidebar taste-test buttons | ~150 | Cascade across 6 imports + state |
| Hero stats strip + Resources stat badges + `stats` export | ~50 | Catalog framing |
| Governance Registry source + qualityScore | ~30 + UI cleanup | 43 lines in `cookbookData.ts` plus `ChapterDetail.tsx:780-799` renderer |
| Misc copy fixes (onboarding step 4 + 6, section dividers, Portal lab mention, jumpstart drift, techniqueMap, TRAINING_RECIPIENT) | ~50 | Citable line edits |
| **New extraction (additive in Builder, not net deletion)** | ~320 | Capstone wizard + critique API integration moves into Builder |

**Total tasks:** 14 (T1–T14), sized to 1–3h each. Total estimated effort: **~22h**.

### Top 3 most-impactful changes

1. **T5 Capstone absorption into Builder + T6 Game.tsx gut** — net ~1,900 LOC out of `Game.tsx`, removes the largest source of inward-loop framing while preserving the only Builder-onboarding teaching surface that exists.
2. **T4 Taste-test + tier-badge full cascade** — removes the chef-progression gamification overlay across `tasteTests.ts`, `useTasteTests.ts`, `TasteTestModal.tsx`, 6 Home.tsx import/state symbols, plus Sidebar prop chain. This is the single change that most reduces "cookbook-as-game" framing.
3. **T2 Governance Registry source field + qualityScore deletion** — 43 occurrences in `cookbookData.ts` plus the Quality badge renderer in `ChapterDetail.tsx`. Removes a class of unverifiable claims that pose audit risk if Elliot is ever asked to substantiate them.

### Highest-risk item

**T5 (Capstone+critique absorption into Builder).** Reasons: (a) it crosses bundles — depends on whether Builder extraction (Stage 3 plan) has run; (b) it adds new Builder UX (toggle mode) that needs a visual baseline; (c) the `/api/critique` integration must work end-to-end inside Builder, not just be moved file-wise. Mitigation: T5 has a Servo visual baseline gate and a critique smoke test; T6 (Game.tsx gut) is sequenced AFTER T5 so the route cannot break.

---

## 2. DELETE table

| ID | File | Lines | What | Reason | Depends on |
|---|---|---|---|---|---|
| D1 | `client/src/lib/cookbookData.ts` | 160, 162, 204, 206, 247, 249, 291, 293, 333, 335, 374, 376, 415, 417, 457, 459, 498, 500, 540, 542, 767, 809 (+ all other `qualityScore: <number>` and `source: "...Governance Registry..."` lines — **actual grep count: 43** across `qualityScore` + `Governance Registry` strings, not 33) | All `qualityScore` numeric values → set to `null`; all `source: "Governance Registry: ..."` strings → remove or replace with neutral citation | Q1: aspirational registry; unverifiable | — |
| D2 | `client/src/lib/cookbookData.ts` (type def line 36) + `client/src/components/ChapterDetail.tsx:780-799` (Quality badge renderer) | type field `qualityScore: number \| null` stays for type-safety **OR** is removed entirely; the renderer block (780-799) deletes regardless | Q1 cascade: removing data without removing the UI leaves stars rendering against `null` | D1 |
| D3 | `client/src/lib/cookbookData.ts` lines 753 (Part IV section comment) through ~973 (end of ch22 block) — specifically the four chapter objects ch17 (753-796), ch18 (797-839), ch19 (840-882), ch22 (971-1012) | 4 governance-meta chapters — keep ch20, ch21 since they classify as supports-Builder | Q-context: loops-inward per Stage 2 audit | — |
| D4 | `client/src/lib/tasteTests.ts` | full file (279 lines) | All 4 taste tests + `tierLabels` | Q7: gamification cut; pure inward-loop | — |
| D5 | `client/src/hooks/useTasteTests.ts` | full file | Hook consumes deleted data | D4 |
| D6 | `client/src/components/TasteTestModal.tsx` | full file | Modal consumes deleted data | D4 |
| D7 | `client/src/pages/Home.tsx` | imports lines 9, 12, 21; state 255–256, 274, 278; effect 282-291 (tier dropdown click-outside); handler 337 (`setActiveTestId`); derived 380 (`activeTest`); JSX block 485-570 (tier badge + dropdown); JSX block 852-862 (TasteTestModal mount); component 867+ (`TierStar`) | Tier badge gamification cascade | D4, D5, D6 |
| D8 | `client/src/components/Sidebar.tsx` | imports line 5 (`tasteTests`); props interface line 18 (`onOpenTest?`); destructure line 23 (`completedTests = []`, `onOpenTest`); JSX 327-345 (taste-test buttons in chapter list) | Sidebar prop chain for taste tests | D4 |
| D9 | `client/src/components/HeroSection.tsx` | imports line 2 (`stats` from cookbookData); JSX 71-90 (stats strip) | Q8: catalog framing stat row | — |
| D10 | `client/src/pages/Resources.tsx` | JSX 215-235 (stat badges block) | Catalog framing | — |
| D11 | `client/src/lib/cookbookData.ts` | 1359-1364 (`export const stats = { ... }`) | Stop publishing the count; only consumer was HeroSection (D9) | D9 |
| D12 | `client/src/pages/Home.tsx` | line 24 (Prompt Lab quickActions entry) — remove the entry; **keep** the array | Q3 cascade: Lab no longer a destination | — |
| D13 | `client/src/components/Sidebar.tsx` | lines 218-225 (Prompt Lab quick link button) | Q3 cascade | — |
| D14 | `client/src/lib/searchIndex.ts` | line 105 (explicit "Prompt Lab" search entry routing to `/game`) | Q3 cascade: search returns dead link | — |
| D15 | `client/src/pages/Game.tsx` | sections: `BlindArena` (lines 720-1061), `PromptAnatomy` (1063-1337), `ChallengeMode` (1339-1674) AFTER critique-integration is absorbed into Builder via T5, `ModeSelection` (2031-2185), `arenaRounds` data (lines 131-275), `anatomyRounds` data (278-437), `challengeScenarios` (440-486) | ~1,650 LOC net delete — preserves `TECHNIQUE_LINKS`, `TechniqueActions`, helpers `FloatingScore`/`ProgressBar`/`TechniqueBadge`/`GameHeader`/`ResultsScreen` until T6 finalizes | T5 |

---

## 3. REFACTOR table

| ID | File | Before | After | Acceptance |
|---|---|---|---|---|
| R1 | `client/src/pages/Home.tsx` line 111 (OnboardingBanner step 6) | `Open the Prompt Builder from the hero CTA to coach a prompt block-by-block. Contact ITS at itservices@mymanatee.org for policy questions.` | Already correctly post-ChatbotWidget. **Verify** — Stage 2 audit flagged "Menu Planning" reference; audit appears stale on HEAD `047102a`. If "Menu Planning" string is absent, mark this item DONE and move on. If present, delete the clause. | grep for "Menu Planning" in Home.tsx returns 0 |
| R2 | `client/src/pages/Home.tsx` lines 104-106 (OnboardingBanner step 4) | `4. Practice — The Prompt Lab has real county scenarios: blind arena comparisons, technique identification, and a 9-step capstone blueprint.` | `4. Build prompts confidently — The Prompt Builder includes a "Walk me through it" toggle that guides you through a 9-step Role/Task/Context/Examples/Reasoning/Format/Constraints/Negative/Uncertainty checklist for high-stakes work.` | Visual: Servo screenshot of expanded onboarding banner before/after; no "Prompt Lab" / "arena" / "anatomy" strings remain |
| R3 | `client/src/pages/Home.tsx` lines 29-34 (section dividers) | `START HERE / EVERYDAY USE / GOING DEEPER / GOVERNANCE & HORIZON` | `Foundations / Templates / Use Cases / Governance` (neutral part labels, drop journey framing) | grep for the four old labels returns 0 in Home.tsx; visual baseline shows new labels |
| R4 | `client/src/components/HeroSection.tsx` (post-D9) | Stats strip + greeting | Greeting alone (top half stays; bottom border + stats strip gone). **No replacement row.** Per Elliot Q8: cut, do not replace with verb-first variant for MVP. | HeroSection renders without the stats row; visual baseline matches |
| R5 | `client/src/lib/searchIndex.ts` lines 80-88 (`techniqueMap`) | `"zero-shot" → ch01, "few-shot" → ch04, "chain-of-thought" → ch05, "cot" → ch05, "rtco" → ch24, "persona" → ch03, "negative prompting" → ch26, "task chaining" → ch09` | `"chain-of-thought" → ch23, "cot" → ch23, "rtco" → ch24, "persona" → ch25, "negative prompting" → ch27` — drop `zero-shot`, `few-shot`, `task chaining` entries (no dedicated chapters exist) | Searching "chain-of-thought" returns ch23 (Chain-of-Thought Prompting); "persona" returns ch25; "negative" returns ch27; vitest covers `getSearchIndex()` output |
| R6 | `client/src/pages/Resources.tsx` line 38-65 (`jumpstartChapters[].chapterId` mappings) | `Ch 8 Negative Prompting → ch26`, `Ch 11 Image Prompting → ch28`, `Ch 12 Testing → ch29`, `Ch 13 Avoiding Bad Answers → ch30` | Fix to: Ch 8 Negative Prompting → ch27; Ch 11 Image Prompting → ch28 (correct); Ch 12 Testing → ch29 (correct); Ch 13 Avoiding Bad Answers → ch30 (correct). Net: only Ch 8 needs the chapterId fix. **Also**: the visible "Ch N" badges (e.g. "Ch 8" rendered on the card) drift from cookbook numbering — either renumber badges to the cookbook chapter number (8→27, 11→28, 12→29, 13→30) **or** drop the inline "Ch N" badge. Recommend: drop the inline numeric badge entirely; keep the title. | Vitest: clicking each jumpstart card navigates to the chapter whose title matches the lesson; visual: no "Ch 8/11/12/13" badges that mismatch chapter content |
| R7 | `client/src/pages/Resources.tsx` line 716 (`TRAINING_RECIPIENT`) AND line 808 (display string `"copy the request to elliot.jarbe@mymanatee.org directly"`) | `const TRAINING_RECIPIENT = "elliot.jarbe@mymanatee.org";` and copy-to-clipboard string | `const TRAINING_RECIPIENT = "ai-workgroup@mymanatee.org";` and update the line 808 copy fallback string to `ai-workgroup@mymanatee.org` | grep for `elliot.jarbe@mymanatee.org` in Resources.tsx returns 0 |
| R8 | `client/src/pages/Portal.tsx` lines 95-98 | `Step-by-step prompting guides, real government examples, and a practice lab for county staff.` | `Step-by-step prompting guides and real government examples for county staff.` (drop "practice lab" wording) | grep "practice lab" in Portal.tsx returns 0 |
| R9 | `client/src/pages/Resources.tsx` lines 261-280 ("Test Your Skills" Link card to `/game`) | Equal-weight CTA next to "Build a Custom Prompt" | **DELETE** the entire `<Link href="/game">...</Link>` block (lines 261-280); change the grid layout from `grid-cols-1 sm:grid-cols-2` to `grid-cols-1` OR leave the Build a Custom Prompt card as the sole CTA in a single-column layout | Visual baseline: only one CTA card under the hero; no /game link from Resources |
| R10 | `client/src/pages/Resources.tsx` line 65 (inline lesson copy in jumpstart Capstone lesson) | `Try building one in the Prompt Builder — it walks you through each block. Or jump to the Prompt Lab to practice with real county scenarios.` | `Try building one in the Prompt Builder — it walks you through each block. Toggle "Walk me through it" in Builder for the full 9-step capstone path.` | grep "Prompt Lab" in Resources.tsx returns 0 |
| R11 | `client/src/pages/Game.tsx` (post-D15) — full file replaced with redirect-to-Builder landing | ~2,200 LOC of game modes | A ~25-line component that calls `useEffect(() => { window.location.href = "/builder/"; }, [])` and renders a fallback "Redirecting to Prompt Builder…" message. **Critical: use `window.location.href`, NOT Wouter's `setLocation`.** Reason: per `builder-extraction-plan-2026-05-14.md`, `/builder/` is a separate IIS Application boundary in prod — full-nav is required (same pattern as `Sidebar.tsx:250`). Wouter cannot route into the other SPA. The `/game` route in `CookbookApp.tsx:24` stays intact. | Hitting `/game` in dev redirects to `/builder/`; hitting `/cookbook/game` in prod redirects to `/builder/` (IIS routes correctly); no Game.tsx exports remain beyond the redirect component |
| R12 | `client/src/pages/Builder.tsx` (location depends on extraction state — see §6 bundle-aware notes) | Builder has no guided mode | Absorb `capstoneSteps` + `capstoneLabels` + the `CapstoneMode` rendering logic from `Game.tsx` (lines 1683-2027) into a new `BuilderWizard` component inside Builder. Surface via a "Walk me through it" toggle in the Builder header. Toggle state stored in `localStorage["builder-wizard-mode"]`. Per Q4: always available, not first-visit-only. **Do not** absorb ChallengeMode's `/api/critique` flow as part of T5 — Builder already has a Critique panel (`CritiquePanel.tsx`) and a Preview panel (`PreviewPanel.tsx`). ChallengeMode is therefore pure deletion in T5, not absorption. | Builder shows a "Walk me through it" toggle in the header; toggling reveals a 9-step wizard whose steps are RTCO+++ (Role, Goal, Context, Examples, Reasoning, Format, Constraints, Negative, Uncertainty); each step has educational tip text; final preview screen has a "Use these blocks" button that populates the standard Builder blocks |
| R13 | `client/src/lib/copilot-handoff.ts` + 8 call sites (Home.tsx ~232/724, Resources.tsx, Sidebar.tsx, Game.tsx-pre-strip, ChapterDetail.tsx, TryItSection.tsx, etc.) | 8 duplicate `localStorage.setItem("cookbook-builder-import", X); window.location.href = "/builder/"` call sites | Add `sendToBuilder(template: string): void` to `client/src/lib/copilot-handoff.ts` (or a new `client/src/lib/builder-handoff.ts`). All 8 call sites import and call this helper. **Bundle-aware:** if Builder extraction has happened, the cookbook-side handoff lives in cookbook only; Builder's own `copilot-handoff.ts` handles a different concern (its actual `sendToTarget` to Copilot/ChatGPT). | grep for the inline `localStorage.setItem("cookbook-builder-import"` pattern returns matches only inside `sendToBuilder()` itself; vitest covers `sendToBuilder` |
| R14 | `server/lib/output-filter.ts` (mid-sentence redaction format) — flagged by Stage 1 P1-A | Inline `[REDACTED:ordinance_section]` mid-sentence | Refuse-then-retry: when filter detects a forbidden pattern, return a `flags: [...]` array AND replace the *entire* assistant response with `"The coach attempted to cite specific county facts. Re-run with more context, or rephrase the request to avoid asking for specific section numbers, dates, or dollar amounts."` Coach panel UI surfaces this as a "Coach withheld response" notice. Server-side filter unit test covers both paths. | Vitest: a critique response containing `Fla. Stat. § 286.011` returns the new refusal message, not inline redaction; UI shows a yellow "Coach withheld response" panel |

**Items NOT in this spec (deferred):**
- Suggestion conflict-handling (Stage 1 P2 / F7) — defer to a separate post-MVP iteration.
- "12 departments" stat hero cleanup — already covered by D9 (full stats strip deletion).

---

## 4. KEEP confirmation

The following survive untouched. The SDD subagent must NOT modify these:

**Pages**
- `Builder.tsx` (all 5 RTCO blocks + technique toggles + Critique/Refine/Preview panels) — only addition: the BuilderWizard toggle from R12
- `Resources.tsx` `promptRecipes` (15 templates) — strongest Builder propellant
- `Resources.tsx` `govResources` + `internalResources` (5 + 4 cards)
- `Resources.tsx` tab system (Courses / Government / Internal / Recipes)
- `Resources.tsx` jumpstart course **structure** (only chapter ID and lab references are touched by R6/R10)
- `Portal.tsx` (everything except R8 copy fix)
- `Home.tsx` hero "Open Prompt Builder" CTA (lines ~577-604)
- `Home.tsx` `PromptOfTheWeek` component (~119-248)
- `Home.tsx` department case studies grid with "Try this prompt in Builder →" (~672-737)
- `Home.tsx` `RecentlyViewed` invocation (~663-667)
- `Home.tsx` `quickActions` array EXCEPT the Prompt Lab entry (D12)

**Components**
- `Sidebar.tsx` everything except D8 (Prompt Lab link, taste-test props/JSX) and the R5-dependent search wiring
- `HeroSection.tsx` everything except D9 (stats strip)
- `ChapterDetail.tsx` everything except D2 (Quality badge renderer)
- `RecipeCard.tsx`, `RecentlyViewed.tsx`, `DifficultyFilter.tsx`, `TryItSection.tsx`, `ImageLightbox.tsx`, `PiiWarningModal.tsx`
- `CritiquePanel.tsx`, `RefineDiff.tsx`, `PreviewPanel.tsx`, `ErrorBoundary.tsx`
- `ui/*` primitives

**Data**
- `cookbookData.ts` — 26 chapters survive: ch01–ch16, ch20, ch21, ch23–ch30 (only ch17, ch18, ch19, ch22 cut per D3; only `qualityScore` values and `source: "Governance Registry: ..."` strings cleaned per D1)
- `departments.ts` (all 12 departments — no changes)
- `personas.ts` (no changes from this spec; PII audit separate)
- `searchIndex.ts` everything except `techniqueMap` (R5) and the Prompt Lab entry (D14)

**Server / infra**
- All of `server/*` except R14 (output-filter refusal pattern)
- All of `mcp/*`
- All of `api/*` Azure Functions
- `azure-pipelines.yml`
- `deploy/`, `iis-setup.ps1`, `install-service.ps1`, `start.ps1`, RUNBOOK

**Hooks**
- `useComposition`, `useMobile`, `usePersistFn`, `usePersona`, `useRecentlyViewed` (all stay)
- `useTasteTests` is the only hook that goes (D5)

---

## 5. Execution sequence

14 tasks. Each is one SDD dispatch. Dependencies in parentheses.

**Phase A — Content data layer (low coupling, parallel-safe)**

- **T1 — Governance Registry + qualityScore cleanup** (D1 + D2): Edit `cookbookData.ts` to set `qualityScore: null` on all currently-numeric values; remove the `source: "Governance Registry: ..."` strings (replace with `null` if a `source` field is required, or remove the line). Delete the Quality badge renderer in `ChapterDetail.tsx:780-799`. Decision point: keep the `qualityScore: number | null` type field or remove it entirely — recommend keep-as-nullable so the type stays usable if reinstated. **Acceptance:** grep `Governance Registry` in `cookbookData.ts` → 0; grep `qualityScore: [0-9]` → 0; `pnpm run check` clean; visual: ChapterDetail no longer renders a Quality stars row.

- **T2 — Chapters 17/18/19/22 deletion** (D3): Remove the four chapter objects from `cookbookData.ts` (preserve commas/closing brackets). Verify `chapters.find(c => c.id === "ch17"|"ch18"|"ch19"|"ch22")` returns undefined. Update `Game.tsx` `TECHNIQUE_LINKS` map (line 58: `ch22` reference removed — replace with `ch24`). Update `searchIndex.ts` if any entries reference these IDs (none currently do per grep, but verify). **Acceptance:** grep `"ch17"|"ch18"|"ch19"|"ch22"` across `client/src/` returns 0 matches outside test fixtures; `pnpm test` green; `pnpm run check` clean.

- **T3 — Hero stats + Resources stat badges + stats export** (D9 + D10 + D11 + R4): Delete the stats strip in `HeroSection.tsx`, the stat badges block in `Resources.tsx`, and the `stats` export in `cookbookData.ts`. Remove the now-unused `stats` import from `HeroSection.tsx`. **Acceptance:** grep `import.*stats.*cookbookData` in `client/src/` returns 0; visual baseline: HeroSection shows only greeting; Resources hero shows no count chips.

**Phase B — Taste-test + tier removal cascade (single task, large blast radius)**

- **T4 — Full taste-test + tier-badge cascade** (D4 + D5 + D6 + D7 + D8): Delete `tasteTests.ts`, `useTasteTests.ts`, `TasteTestModal.tsx`. In `Home.tsx`: remove imports (9, 12, 21), state (255-256, 274), the click-outside effect for `tierRef`, `useTasteTests` destructure (278), `setActiveTestId` handler call (337), `activeTest` derived (380), JSX 485-570 (tier badge dropdown), TasteTestModal mount 852-862, `TierStar` component (867+). In `Sidebar.tsx`: remove `tasteTests` import (5), `onOpenTest` prop (18, 23), `completedTests` destructure default (23), and the IIFE rendering the taste-test buttons (327-345). Remove `completedTests` and `onOpenTest` from the call site that passes them into Sidebar (look for `<Sidebar` in `Home.tsx`). **Acceptance:** grep `taste\|TasteTest\|tierLabel\|currentTier\|tierDropdown\|TierStar` across `client/src/` returns 0; `pnpm run check` clean; `pnpm test` green; visual baseline: Home page has no tier badge, Sidebar chapter list has no "Take quiz" / "Test passed" buttons.

**Phase C — Capstone wizard absorption (keystone — must precede Game-strip)**

- **T5 — Absorb CapstoneMode into Builder + delete ChallengeMode** (R12 + part of D15): Create `client/src/components/BuilderWizard.tsx` (or under `pages/builder/BuilderWizard.tsx`). Copy `capstoneSteps` (Game.tsx 1683-1693), `capstoneLabels` (1695-1705), and the `CapstoneMode` rendering logic (1707-2027) into the new component. Adapt:
  - Remove the `onBack` prop pattern (wizard is in-page in Builder, not a sub-page)
  - Replace the "Try in Builder" final-screen CTA with "Use these blocks" that calls a new `onComplete(blocks)` callback to populate Builder's RTCO blocks
  - Add an "X / Exit wizard" button in the wizard header that just hides the wizard and returns Builder to standard mode
  - Add a toggle button in Builder's header: "Walk me through it" — toggles `wizardMode` state (default false), persists to `localStorage["builder-wizard-mode"]`
  - Per Q4: toggle is always-available, not first-visit-only

  Delete `ChallengeMode` from `Game.tsx` (lines 1339-1674) — its critique flow is duplicated by Builder's existing `CritiquePanel.tsx`; no absorption needed, pure deletion.

  **Bundle-aware:** if Builder extraction has happened (per Stage 3 plan), the wizard lands in `prompt-builder/client/src/`; if not, it lands in `prompt-cookbook-gov-mvp/client/src/`. Either way: same component, same toggle. See §6.

  **Acceptance:** Builder renders a "Walk me through it" toggle in the header; toggling shows the 9-step wizard with educational tips; clicking "Use these blocks" on the final step populates the Role/Goal/Context/Examples/Reasoning/Format/Constraints/Negative/Uncertainty blocks; Servo screenshot baseline saved at `tests/screenshots/builder-wizard.png`; vitest smoke test mounts Builder and verifies the toggle exists; `pnpm test` green.

**Phase D — Game.tsx final gut + Prompt Lab dead-reference sweep (after T5)**

- **T6 — Gut Game.tsx to redirect-to-Builder** (R11 + remainder of D15): Replace the entire content of `Game.tsx` with a ~25-line component that does `useEffect(() => { window.location.href = "/builder/"; }, [])` and renders a "Redirecting to Prompt Builder…" message. **Critical:** use `window.location.href` (full nav), NOT Wouter's `setLocation` — `/builder/` is a separate IIS Application boundary in prod (per Stage 3 extraction plan §3). Same pattern as `Sidebar.tsx:250`. The `/game` route in `CookbookApp.tsx:24` stays intact so external links survive. **Acceptance:** `pnpm run check` clean; `pnpm test` green; manually navigate to `/game` in dev → ends up at `/builder/`; the route URL stays at `/game` only momentarily before the full nav fires.

- **T7 — Prompt Lab dead-reference sweep** (D12 + D13 + D14 + R10 + R2 + R8): In one commit, sweep remaining "Prompt Lab" / "practice lab" / `/game` references:
  - `Home.tsx:24` — remove the Prompt Lab quickActions entry (D12)
  - `Home.tsx:104-106` — rewrite onboarding step 4 per R2
  - `Sidebar.tsx:218-225` — remove the Prompt Lab quick-link button (D13)
  - `searchIndex.ts:105` — remove the Prompt Lab search entry (D14)
  - `Resources.tsx:65` — fix the inline "Or jump to the Prompt Lab" copy per R10
  - `Resources.tsx:261-280` — delete the "Test Your Skills" `/game` CTA card per R9
  - `Portal.tsx:97` — remove "practice lab" wording per R8
  - Remove any now-unused `FlaskConical` imports across the changed files
  - **Acceptance:** grep `"Prompt Lab"` (case-sensitive) in `client/src/` returns matches only inside `Game.tsx` redirect copy if at all; grep `/game` outside `CookbookApp.tsx` and `Game.tsx` returns 0; visual baseline: Home quickActions row shows 2 tiles (Builder + Resources), Sidebar quick links no longer show Prompt Lab.

**Phase E — Polish (parallel-safe, low coupling)**

- **T8 — Section dividers refactor** (R3): Update `Home.tsx` `sectionDividerConfig` (lines 29-34) to `Foundations / Templates / Use Cases / Governance`. **Acceptance:** visual baseline; grep old labels returns 0.

- **T9 — TRAINING_RECIPIENT change** (R7): Edit `Resources.tsx:716` and the display string at `:808`. **Acceptance:** grep `elliot.jarbe@mymanatee.org` in `client/src/` returns 0; `mailto:` link uses ai-workgroup.

- **T10 — searchIndex techniqueMap fix** (R5): Rewrite the `techniqueMap` object in `searchIndex.ts:80-88` per the corrected mappings. Add a vitest test that searches "chain-of-thought", "persona", "negative" and asserts the right chapter IDs. **Acceptance:** vitest green; manual search in Sidebar surfaces correct chapters.

- **T11 — Jumpstart chapter ID drift fix** (R6): In `Resources.tsx:37-66`, change Ch 8 Negative Prompting `chapterId: "ch26"` → `"ch27"`; drop the inline "Ch N" badges from the rendered jumpstart cards in CoursesTab JSX (where they appear in the card title row). **Acceptance:** clicking each jumpstart card lands on the correct chapter; no "Ch 8/11/12/13" badges that mismatch the cookbook chapter number.

- **T12 — `sendToBuilder()` helper extraction** (R13): Add the helper to `client/src/lib/copilot-handoff.ts` (or a new `lib/builder-handoff.ts` if scope-of-concern separation is preferred). Replace all 8 inline call sites. Add vitest unit test. **Acceptance:** grep for the inline `localStorage.setItem("cookbook-builder-import"` pattern matches only inside `sendToBuilder` itself; vitest covers the helper.

- **T13 — OnboardingBanner step 6 verification** (R1): Verify (do not blindly re-edit) — Stage 2 audit flagged "Menu Planning" in step 6, but HEAD `047102a` may have already fixed this. Grep first; if 0 hits, mark complete; if present, delete the clause. **Acceptance:** grep "Menu Planning" in `Home.tsx` returns 0.

- **T14 — Server output-filter refusal pattern** (R14): Edit `server/lib/output-filter.ts` to switch from inline `[REDACTED:...]` mid-sentence rewriting to a refuse-then-replace pattern. Update server vitest. Update Builder's `CritiquePanel.tsx` / `RefineDiff.tsx` / `PreviewPanel.tsx` to surface the refusal as a yellow "Coach withheld response" notice (vs. silently inlining redaction markers). **Acceptance:** server vitest green; integration test: send a prompt that contains `Fla. Stat. § 286.011` → response panel shows the refusal copy, not inline `[REDACTED:...]`.

### Dependency graph

```
T1 ─┐
T2 ─┼── (parallel-safe Phase A) ──┐
T3 ─┘                              │
                                    ├── T4 (Phase B — large blast radius, isolated) ──┐
                                    │                                                  │
                                    │                                                  ├── T5 (Phase C — keystone) ──┐
                                    │                                                  │                              │
                                    │                                                  │                              ├── T6 (Phase D — depends on T5) ──┐
                                    │                                                  │                              │                                  │
                                    │                                                  │                              │                                  ├── T7 (Phase D — depends on T6)
                                    │                                                  │                              │                                  │
                                    └──────────────────────────────────────────────────┴──────────────────────────────┴── T8/T9/T10/T11/T12/T13/T14 (Phase E — parallel-safe)
```

### Suggested sequencing for SDD operator

1. Day 1 morning: T1 → T2 → T3 in one batch (Phase A — all touch data/HeroSection independently; can be one SDD cycle if reviewer is OK with a slightly larger PR, or three small ones)
2. Day 1 afternoon: T4 (Phase B — single large cascade; do it standalone with extra review)
3. Day 2 morning: T5 (Phase C — Capstone absorption; new component + new toggle; needs Servo baseline)
4. Day 2 afternoon: T6 → T7 (Phase D — Game gut + lab sweep; T7 depends on T6 because removing the Prompt Lab card before the route redirects is fine, but doing both in one commit keeps the diff coherent)
5. Day 3: T8 through T14 (Phase E — parallel; can be batched 2-3 per SDD cycle since each is small and independent)

**Total wall time: 3 working days for one operator, or 2 days with two operators running parallel-safe phases.**

---

## 6. Bundle-aware notes (Builder extraction coordination)

Per `docs/builder-extraction-plan-2026-05-14.md`, Builder is being extracted to its own repo (`~/Projects/prompt-builder/`). The timing of this spec's execution vs. the extraction matters for **T5** and **T12**:

| Task | If executed BEFORE Builder extraction | If executed AFTER Builder extraction |
|---|---|---|
| **T5 — BuilderWizard component** | Lives in `prompt-cookbook-gov-mvp/client/src/components/BuilderWizard.tsx`; copied (with code) to `prompt-builder/` during extraction step 3 | Lives directly in `prompt-builder/client/src/components/BuilderWizard.tsx`; never enters cookbook repo |
| **T5 — Builder.tsx toggle hook** | Lives in `prompt-cookbook-gov-mvp/client/src/pages/Builder.tsx`; the change moves with Builder during extraction step 3 | Lives directly in `prompt-builder/client/src/pages/Builder.tsx` |
| **T12 — `sendToBuilder()` helper** | Lives in `prompt-cookbook-gov-mvp/client/src/lib/copilot-handoff.ts` (cookbook side — the helper that *sends to* `/builder/`); the file stays in cookbook repo (this is the cookbook-side handoff, not Builder's own send-to-Copilot handoff) | Lives in `prompt-cookbook-gov-mvp/client/src/lib/copilot-handoff.ts` (same location — the cookbook still needs to send to Builder via `localStorage` + full nav even after Builder is in its own repo) |
| **All other tasks (T1–T4, T6–T11, T13, T14)** | Cookbook-only — extraction has no effect on these | Cookbook-only — extraction has no effect on these |

**Recommended ordering:** Execute this spec (T1–T14) BEFORE Builder extraction. Reasons:
1. Strip-back reduces the LOC count Builder extraction has to move (T5 absorbs ~320 LOC of Capstone into Builder; extraction then carries that as part of Builder's payload).
2. T4 (taste-test cascade) and T6 (Game gut) reduce the cookbook surface area that needs to be tested post-extraction.
3. The /game route redirect (R11) is in the cookbook repo regardless — Builder repo never owns it.

**If the order is reversed** (extract first, then strip-back), T5 dispatches into the Builder repo, and T6 dispatches into the cookbook repo — same outcome but the diffs land in different PRs.

**Hard constraint either way:** T5 (Capstone absorption) must precede T6 (Game gut). The Capstone code in Game.tsx is the source material for the wizard; deleting Game.tsx before extracting Capstone would lose the only complete RTCO+++ walkthrough that exists.

---

## 7. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| RR1 | **T4 taste-test cascade misses a reference** and a runtime error fires on a screen we didn't think to check (e.g. a deep-link from county training materials that opens Home with `?test=foundation`). | Medium | Medium (broken page for a small audience) | Run `pnpm run check` AND `pnpm test` AND a manual Servo screenshot pass of Home + Sidebar + Resources before commit. Grep for `taste\|Taste\|tier` across the whole `client/src/` after the change — should return only `useTasteTests` definition (which is also deleted) and nothing else. |
| RR2 | **T5 BuilderWizard absorption doesn't preserve the educational tip text** that Capstone has but Builder lacks. The wizard becomes "just a different layout of the same blocks" with no teaching value. | Medium | Medium (loses the strategic value of absorbing) | Acceptance criterion in T5 requires each of the 9 wizard steps to have inline tip text rendered (not just label + textarea). Visual baseline captures the tip text. |
| RR3 | **T6 Game.tsx redirect uses Wouter `setLocation` instead of `window.location.href`** and breaks in prod when IIS serves `/builder/` from a separate Application. | Medium | High (Builder unreachable from /game in prod) | Spec text in R11 + T6 explicitly calls out `window.location.href`. SDD prompt for T6 must quote this verbatim. Test in dev with `pnpm run preview` against the Express server (closest local approximation of IIS routing). |
| RR4 | **T1 governance registry cleanup leaves a dangling `qualityScore` type field** that some other consumer relies on (third-party import, future feature). | Low | Low | Spec recommends keeping the `qualityScore: number \| null` field for type safety even after all values become null. Reinstating values later is then a one-line per chapter. |
| RR5 | **T11 (jumpstart chapter ID drift) — dropping the inline "Ch N" badges** loses a visual affordance that some users rely on to know which chapter the lesson maps to. | Low | Low | Keep the lesson title (which already describes the topic); drop only the misleading numeric badge. Servo baseline captures before/after. If user-research signal says the number is valued, restore as `chapter.number` (the cookbook's actual number) rather than the hardcoded "Ch 8" string. |
| RR6 | **T2 (chapters 17/18/19/22 deletion) breaks deep links** from county-internal documentation that references `mymanatee.org/cookbook/#ch17`, etc. | Low | Medium | Audit before deletion: grep county-internal docs (cookbook README, county SharePoint exports, presentation PDFs) for `#ch17|#ch18|#ch19|#ch22`. If any external links exist, replace with redirects in `Home.tsx` (e.g., `useEffect(() => { if (hash matches ch17) redirect to ch20 or Resources}` — TBD per Q-follow-up). For MVP, accept the broken deep-link risk and document it. |
| RR7 | **T14 (output-filter refusal pattern) breaks the existing Critique flow** in a way that the visual UI doesn't surface. User sees an empty critique panel and thinks the coach is broken. | Medium | Medium | T14 acceptance requires the CritiquePanel UI to render a yellow "Coach withheld response" notice with the refusal copy AND a "Re-run with more context" button. Integration test covers the path. |
| RR8 | **Servo screenshot baselines drift** between T-N and T-N+1 because Phase E tasks run in parallel and one of them accidentally affects a screen another also touched. | Low | Low | Operator runs full Servo regression after each phase (A/B/C/D/E). 5 baseline screens: Portal, Home (top + chapter list), Resources (Courses tab + Recipes tab), Builder (standard + wizard mode), Game (redirect screen). |

---

## 8. Open follow-ups (needing Elliot's judgment, can be answered async)

| # | Question | Why it matters | Suggested default |
|---|---|---|---|
| OF1 | T1 — Keep the `qualityScore: number \| null` type field in the `Chapter` type, or remove the field entirely? | If reinstating later, keep-as-nullable is one-line per chapter. If never reinstating, removing the field shrinks the type. | Keep as nullable; remove only if storage cost becomes a concern. |
| OF2 | T2 — Are any county-internal documents (training PDFs, SharePoint pages, email sigs) deep-linking to `#ch17`, `#ch18`, `#ch19`, or `#ch22`? | If yes, add redirect handlers; if no, accept the deletion. | Audit during T2 dispatch; if uncertain, add a `useEffect` redirect from those hashes to `/resources?tab=internal`. |
| OF3 | T6 — Should the `/game` redirect destination be `/builder/` exactly, or `/builder/?wizard=1` to auto-open the wizard for users coming from the old Lab URL? | Users who bookmarked `/game` were learning by practice; the wizard gives them the same teaching loop. | Default `/builder/?wizard=1` (auto-open wizard) — preserves the teaching intent of the old Lab. Builder reads `?wizard=1` to set `wizardMode=true` on mount. |
| OF4 | T14 — Should the refusal message link to a "why am I seeing this?" explainer? | The current spec just shows a yellow notice; if county staff repeatedly hit it, they'll want a "what happened" page. | Defer to post-MVP iteration. The notice copy itself ("Re-run with more context, or rephrase the request to avoid specific section numbers, dates, or dollar amounts") carries enough information for MVP. |
| OF5 | Builder extraction timing — execute this spec BEFORE or AFTER Stage 3 extraction? | §6 has the matrix; the order changes which repo T5/T12 land in. | Recommend BEFORE extraction (this spec first, extraction second). Reasons in §6. |
| OF6 | Are there content-substitution proposals needed for the hero stats strip (D9), or is the "remove with no replacement" path (R4) confirmed? | Stage 2 audit recommended "verb-first stats" as alternative; Elliot's Q8 said "verb-first stats OR remove" — this spec defaults to remove. | R4 confirms "remove with no replacement" for MVP. If a verb-first row is wanted later, propose as separate post-MVP iteration. |

---

## 9. Skill-lens application notes

- **cs-content-creator** applied to: R2 (onboarding step 4 rewrite), R3 (section divider new labels), R10 (jumpstart Capstone lesson copy fix), R14 (filter refusal copy). All replacement copy avoids the banned-words list and the "Despite challenges..." / participle-trailing patterns.
- **frontend-ui-ux** applied to: D9 / R4 (hero stats removal — leaves only greeting, accepted whitespace; no visual gap fix needed), R9 (single CTA card layout — drop the second column, don't widen the first), R11 (redirect screen — minimal "Redirecting…" UI per pattern in `Sidebar.tsx:250`), R12 (wizard toggle placement in Builder header).
- **ui-design-system** applied to: T4 cascade (removing tier badge frees the right side of Home's chrome strip — no other component fills that space), T8 (section dividers — labels stay 4-row sentinel pattern, just neutralized content), R12 (wizard mode shares the same color tokens as Builder's standard mode; no new design tokens introduced).
- **cs-ux-researcher** applied to: RR1 (deep-link risk for `?test=` URLs from external training materials), RR6 (deep-link risk for deleted chapters), OF2 (county-internal deep-link audit), OF3 (default-open wizard on `/game` redirect preserves teaching intent of old Lab users).
- **architecture-designer** applied to: §5 dependency graph + phase grouping (parallel-safe ordering, T5 keystone), §6 bundle-aware notes (T5/T12 cross-repo coordination), §7 risk register (RR3 IIS Application boundary, RR8 Servo regression after each phase).

---

## 10. Spec hygiene

- Every DELETE / REFACTOR item is citable (file:line) and bounded (one concern per row).
- Each task has acceptance criteria covering: file-level (which files changed), test-level (`pnpm test` + new vitest where needed), visual-level (Servo screenshot where UI changed), build-level (`pnpm run check`, `pnpm run build`).
- The spec does NOT execute changes — it is a planning artifact. Per task constraints: no code modified, no files moved, no builds or tests run as part of this Stage 4.
- The spec accommodates either ordering (this spec first vs. Builder extraction first) via the bundle-aware notes in §6.
- The 14-task count reflects natural concern boundaries; combining T1+T2+T3 into one task is acceptable for an SDD operator who wants larger PRs, but the per-task granularity below makes review smaller-stake.

**End of spec.**
