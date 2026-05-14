# Cookbook Content + Code Audit — Stage 2 UX Deep-Dive

**Date:** 2026-05-14
**Auditor:** Claude Code (rag-architect + cs-content-creator + coding-standards + senior-frontend lenses)
**Branch:** feat/cookbook-mvp
**Commit at audit:** 516011d
**In-scope files:** Home.tsx, Resources.tsx, Game.tsx, ChapterDetail.tsx, Sidebar.tsx, Portal.tsx, cookbookData.ts, departments.ts, personas.ts, searchIndex.ts, tasteTests.ts, HeroSection.tsx
**Out of scope (already audited):** persona PII (see `docs/persona-audit-2026-05-13.md`)

---

## Classification Test (applied throughout)

For every content item: **"If the user is mid-Builder task and clicks this, does it help them finish — or does it draw them off the path?"**

| Class | Meaning |
|---|---|
| **propels-to-Builder** | Direct CTA or path that lands the user in Builder with momentum |
| **supports-Builder** | Reference material a Builder user might consult mid-task (RTCO explanation, technique definitions, examples) |
| **loops-inward** | Pulls user deeper into the cookbook as a destination of its own — no Builder connection |
| **no-purpose** | Exists for legacy reasons; serves no active goal |
| **broken** | Wrong, contradictory, or refers to deleted/missing things |

---

## Part 1 — Content Audit

### Home.tsx (cookbook home page)

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| Home.tsx | OnboardingBanner step 6 mentions "Click 'Menu Planning' in the bottom right" | 111 | **broken** | ChatbotWidget was deleted in Task #19 (commit 88aeaaa). The widget is gone, so this instruction points at nothing. | **DELETE** entire reference. P0. |
| Home.tsx | OnboardingBanner step 4 — "Prompt Lab has real county scenarios: blind arena, technique identification, 9-step capstone" | 104-106 | loops-inward | Directs first-time users into a 4-mode game as a destination. The capstone IS Builder-related; arena/anatomy are not. | **REFACTOR** to point at Builder + Capstone only |
| Home.tsx | OnboardingBanner whole banner (steps 1-6) | 56-117 | supports-Builder | Onboarding overall is fine — establishes department picker → recipes → Builder flow. Step 6 is the broken one. | **KEEP** structure, **REFACTOR** steps 4 & 6 |
| Home.tsx | quickActions array — Prompt Lab card | 24 | loops-inward | "Practice improving prompts with 10 real scenarios" — game-as-destination, doesn't feed Builder | **DELETE** or replace with second Builder-supporting tile |
| Home.tsx | quickActions — Prompt Builder card | 25 | propels-to-Builder | Direct Builder CTA | **KEEP** |
| Home.tsx | quickActions — Resources card | 26 | supports-Builder | Resources Recipes tab does feed Builder (Use in Builder buttons) | **KEEP** |
| Home.tsx | "Open Prompt Builder" hero CTA | 577-604 | propels-to-Builder | Single strongest Builder propellant on the page | **KEEP** — this is the model for the whole page |
| Home.tsx | PromptOfTheWeek component | 119-248 | propels-to-Builder | "Open in Builder" button + Copy. Builder-friendly. | **KEEP** |
| Home.tsx | Department case studies grid with "Try this prompt in Builder →" | 672-737 | propels-to-Builder | Each case study card lands user in Builder with prompt pre-loaded | **KEEP** |
| Home.tsx | Tier badge + dropdown ("Starter / Home Cook / Sous Chef / Head Chef / Executive Chef") | 485-570 | **loops-inward** | Gamification ladder. Tied to taste-test completion. Pure destination — no Builder connection. | **DELETE** |
| Home.tsx | SectionDivider labels ("START HERE", "EVERYDAY USE", "GOING DEEPER", "GOVERNANCE & HORIZON") | 29-34 | loops-inward | Reinforces book-as-journey framing rather than Builder-as-tool | **REFACTOR** to plain part labels, or **DELETE** |
| Home.tsx | "SHOW N MORE CHAPTERS" expand control | 791-802 | loops-inward | Encourages browsing the catalog beyond the relevant filtered set | **KEEP** (provides escape valve) but make less prominent |
| Home.tsx | Footer source list (GovAI, San Jose, NIST, NJ OIT, MA EOTSS, etc.) | 843-845 | supports-Builder | Citations build trust; no Builder cost | **KEEP** |
| Home.tsx | RecentlyViewed component invocation | 663-667 | supports-Builder | Helps return users get back to a chapter they were reading | **KEEP** |

### Resources.tsx

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| Resources.tsx | "Cookbook Foundations" Jumpstart course — 14 lessons | 37-66, 370-525 | **loops-inward** | A second 14-lesson curriculum that duplicates Chapter content. Separate copy maintained by hand. The "Build a Prompt" inline action does propel out — but the lesson body itself is a parallel content stream that competes with chapters. | **REFACTOR**: cut to 5 most useful lessons OR derive from `chapters[]` so there's one source of truth |
| Resources.tsx | jumpstartChapters[].lesson long-form content | 37-66 | loops-inward | Each lesson body (~300-500 words) is a complete teaching artifact — encourages reading inside Resources, not building | **REFACTOR**: shorten to 2-3 sentences each + link to corresponding chapter |
| Resources.tsx | jumpstartChapters[].chapterId mapping | 37-66 | broken (partially) | Ch11 ("Bullet-to-Paragraph") maps to ch28 "Image Prompting"; Ch12 maps to ch29 "Testing Your Prompts"; Ch13 maps to ch30 "Defensive Prompting". The visible numbers don't match cookbook chapter IDs — confusing if user notices. | **REFACTOR** or **DELETE** — see Code Audit P1 |
| Resources.tsx | Stat badges: "14 Jumpstart chapters / 15 Prompt recipes / 5 Gov resources" | 217-220 | loops-inward | Catalog-bragging stats — reinforces book-as-collection framing | **DELETE** |
| Resources.tsx | "Build a Custom Prompt" CTA (Wrench card) | 241-260 | propels-to-Builder | Direct Builder propellant at top of page | **KEEP** |
| Resources.tsx | "Test Your Skills" CTA (Flask card → /game) | 261-281 | loops-inward | Sibling to Builder CTA but points to lab game. Visually equal weight implies equal importance. | **DELETE** or demote |
| Resources.tsx | govResources list (GovAI, NACo, NIST, White House, FL Digital Service) | 68-74 | supports-Builder | Trust-building external citations; readers may follow when validating prompt assumptions | **KEEP** |
| Resources.tsx | internalResources — AI Working Group card | 78-87 | supports-Builder | Tells users who to ask | **KEEP** |
| Resources.tsx | internalResources — AI Governance Handbook card | 89-101 | supports-Builder | Policy reference; high-value for users about to send prompts | **KEEP** |
| Resources.tsx | internalResources — Request AI Training card | 103-115 | supports-Builder | Drives off-app value (workshops) | **KEEP** |
| Resources.tsx | internalResources — Persona Notice card | 117-126 | supports-Builder | Compliance disclosure, required | **KEEP** |
| Resources.tsx | promptRecipes (15 plug-and-play templates) — Writing, Analysis, Data, Planning, County Work | 577-597 | propels-to-Builder | "Use in Builder" button on each. Strong, direct Builder propellant. | **KEEP** — model for "what good looks like" |
| Resources.tsx | RecipesTab category color/layout system | 599-710 | supports-Builder | Renders the recipes; supports Builder propellant | **KEEP** |
| Resources.tsx | Tab system: Courses / Government / Internal / Recipes | 129-134 | supports-Builder | Organizes resources; not problematic | **KEEP** |
| Resources.tsx | Footer "AI Working Group Resource Board" | 358-363 | supports-Builder | Light footer, no harm | **KEEP** |

### Game.tsx (Prompt Lab — 4 modes)

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| Game.tsx | BlindArena mode (10 rounds, vote A vs B) | 745-1061 | **loops-inward** | Pure quiz with score/play-again/score-tracking. No path back to Builder during play. TechniqueActions panel at reveal does link to chapters + Builder, but the game itself is a destination. | **DELETE** |
| Game.tsx | PromptAnatomy mode (10 scenarios, identify technique) | 1067-1337 | **loops-inward** | Same pattern — quiz mode with play-again, score tracker, no Builder integration during interaction | **DELETE** |
| Game.tsx | ChallengeMode (5 scenarios, write your own prompt, AI critiques) | 1343-1674 | loops-inward (with Builder-adjacent value) | User writes a prompt in a textarea, gets critique from `/api/critique`, sees reference prompt, self-rates 1-5 stars. This IS Builder-like behavior — but in a parallel UI to Builder itself. | **DELETE** or **MERGE** into Builder as a "test your prompt" feature |
| Game.tsx | CapstoneMode (9-step RTCO+++ wizard) | 1707-2027 | propels-to-Builder (functionally) | The 9 capstone steps are literally a guided Builder onboarding wizard. Has a "Try in Builder" button on the preview screen. | **MOVE INTO Builder** as a first-run / "show me how" wizard. See Part 4 verdict. |
| Game.tsx | TECHNIQUE_LINKS map (technique → chapters + builderTip) | 44-85 | supports-Builder | The bridge content from game to Builder. Useful pattern; rescue it. | **KEEP** the data structure, **MOVE** into a shared lib file |
| Game.tsx | TechniqueActions component | 91-127 | supports-Builder | The propel-out path from a game finding to Builder | **KEEP** as a pattern for other surfaces |
| Game.tsx | ModeSelection page (4 mode cards) | 2085-2185 | loops-inward | Lab entry portal — only matters if Lab continues to exist | **DELETE** with Lab |

### cookbookData.ts (30 chapters)

#### Headline counts

| Class | Chapters | IDs |
|---|---|---|
| propels-to-Builder | 1 | ch24 (RTCO Framework — the Builder's literal mental model) |
| supports-Builder | 25 | ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10, ch11, ch12, ch13, ch14, ch15, ch16, ch20, ch21, ch23, ch25, ch26, ch27, ch28, ch29, ch30 |
| loops-inward | 4 | ch17, ch18, ch19, ch22 |
| broken | 0 | (persona AMBER entries tracked in separate audit) |
| no-purpose | 0 | |

#### Per-chapter classification (full table)

| ID | Title | Part | Class | Reason |
|---|---|---|---|---|
| ch01 | What Is a Prompt? | I | supports-Builder | Defines prompt vocabulary; useful primer |
| ch02 | Prompt Safety Rules | I | supports-Builder | Required compliance reading; protects Builder users |
| ch03 | Email Tone Adjuster | II | supports-Builder | Production template; users will copy this into Builder |
| ch04 | Meeting Notes Summarizer | II | supports-Builder | Production template |
| ch05 | Plain Language Converter | II | supports-Builder | Production template |
| ch06 | Status Update Formatter | II | supports-Builder | Production template |
| ch07 | Document Proofreader | II | supports-Builder | Production template |
| ch08 | FAQ Answer Generator | II | supports-Builder | Production template |
| ch09 | Meeting Agenda Generator | II | supports-Builder | Production template |
| ch10 | Acronym Expander | II | supports-Builder | Production template |
| ch11 | Bullet-to-Paragraph Converter | II | supports-Builder | Production template |
| ch12 | Calendar Event Creator | II | supports-Builder | Production template |
| ch13 | Prompt Efficiency Strategies | III | supports-Builder | Search-first / combine prompts / constrain length — practical |
| ch14 | Low-Risk Use Cases | III | supports-Builder | Onboarding scaffolding |
| ch15 | Mid-Risk Use Cases | III | supports-Builder | Risk thinking |
| ch16 | High-Risk Boundaries | III | supports-Builder | Prohibited list — protects users |
| **ch17** | The 9-Dimension Scoring Rubric | IV | **loops-inward** | Meta-content about a registry/scoring system that may not be live. Teaches user how the cookbook governs itself — not how to prompt. |
| **ch18** | Safety Gates & PII Protection | IV | **loops-inward** | Same — meta-content about automated gates in a "governance system" |
| **ch19** | Audit Trails & Records Management | IV | **loops-inward** | Compliance procedure, not prompting skill. Useful elsewhere (Resources internal tab) but doesn't belong in a chapter list. |
| ch20 | Training & Skill-Building | III | supports-Builder | Points users at external InnovateUS training; reasonable reference |
| ch21 | The Manager's Guide to AI Prompting | III | supports-Builder | Useful for one specific audience (managers) |
| **ch22** | Templates & the Training Horizon | III | **loops-inward** | Talks about a "template registry" + "training roadmap." Meta-content about the cookbook's own scaffolding. |
| ch23 | Chain-of-Thought Prompting | I | supports-Builder | Core technique that Builder exposes via toggle |
| ch24 | The RTCO Framework | I | **propels-to-Builder** | This IS the Builder's data model. Strongest possible Builder-supporting chapter. |
| ch25 | Persona & Scenario Prompting | I | supports-Builder | Core technique |
| ch26 | Microsoft Copilot Tips for County Staff | II | supports-Builder | App-specific tips; useful for users who copy prompt to Copilot |
| ch27 | Negative Prompting | I | supports-Builder | Core technique that Builder exposes |
| ch28 | Image Prompting | IV | supports-Builder | Niche but legitimate |
| ch29 | Testing Your Prompts | IV | supports-Builder | Builder-adjacent — verify before relying on a prompt |
| ch30 | Defensive Prompting | IV | supports-Builder | Anti-hallucination toolkit — directly improves Builder output |

#### cookbookData.ts data export

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| cookbookData.ts | `stats` export (`chapters: 30, prompts: "110+", templates: ~10, sources: "14+"`) | 1359-1364 | loops-inward | Catalog-of-content stats. Consumed by HeroSection.tsx. The user explicitly flagged inward-loop framing. | **DELETE** or stop rendering |
| cookbookData.ts | `qualityScore` field references (10 templates with scores 9.2-9.6) | 160, 204, 247, 291, 333, 374, 415, 457, 498, 540 | supports-Builder (if registry is real) / **broken** (if not) | Every Part II template says "Source: Governance Registry: X v1 — Tested, Quality Score 9.6/10". This implies a live governance registry. If that doesn't exist post-pivot, these are stale claims. | **VERIFY** with Elliot — see Open Questions |

### Sidebar.tsx

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| Sidebar.tsx | Search input (semantic search) | 91-107 | supports-Builder | Helps users find content fast | **KEEP** (but fix bugs in searchIndex — see Code Audit) |
| Sidebar.tsx | Department dropdown | 110-169 | supports-Builder | Department filtering is the main personalization affordance | **KEEP** |
| Sidebar.tsx | Quick links — Recently Viewed | 173-189 | supports-Builder | Return-user shortcut | **KEEP** |
| Sidebar.tsx | Quick links — All Recipes (→ /resources?tab=recipes) | 190-201 | propels-to-Builder | Drives traffic to the recipes tab which propels to Builder | **KEEP** |
| Sidebar.tsx | Quick links — Resources | 202-209 | supports-Builder | Resource navigation | **KEEP** |
| Sidebar.tsx | Quick links — Build a Prompt | 210-217 | propels-to-Builder | Direct Builder link | **KEEP** |
| Sidebar.tsx | Quick links — Prompt Lab | 218-225 | loops-inward | Lab is the destination this points to | **DELETE** when Lab is removed |
| Sidebar.tsx | Part-by-part chapter list with collapse/expand | 286-351 | supports-Builder | Standard ToC | **KEEP** |
| Sidebar.tsx | Taste-test buttons per part ("Take quiz →" / "Test passed") | 327-344 | **loops-inward** | Quiz gamification. Loops inward unless taste tests are deleted. | **DELETE** with taste tests |

### tasteTests.ts (gamification content)

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| tasteTests.ts | All 4 tests (Foundation, Template, Strategy, Governance) | 23-279 | **loops-inward** | Pure gamification. Drives Tier badge in Home (Starter → Executive Chef). No path to Builder. | **DELETE** entire file |
| tasteTests.ts | `tierLabels` array | 21 | loops-inward | Powers the gamification ladder | **DELETE** |

### Portal.tsx

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| Portal.tsx | "Step-by-step prompting guides, real government examples, and a practice lab for county staff" — Cookbook card description | 95-98 | partial-broken | Mentions "practice lab" — will be a dead reference once Game is cut | **REFACTOR** to "Step-by-step prompting guides and real government examples." Drop "practice lab." |
| Portal.tsx | Hero / Builder card / Coming Soon / Footer | rest | propels-to-Builder | Clean portal landing — model UI | **KEEP** |

### HeroSection.tsx

| File | Item | Lines | Class | Reason | Recommendation |
|---|---|---|---|---|---|
| HeroSection.tsx | Stats strip ("N recipes / N templates / N departments") | 72-90 | loops-inward | Catalog stats reinforce book-as-collection framing. Renders `chapters.length` (30) / `stats.templates` (~10) / `departments.length` (12). | **DELETE** stats strip |
| HeroSection.tsx | Hero image (robot chef) + greeting | 19-69 | supports-Builder | Brand identity; greeting personalizes via department | **KEEP** |

---

## Part 2 — Code Audit

| File | Line(s) | Issue | Severity | Recommendation |
|---|---|---|---|---|
| Home.tsx | 111 | Onboarding step 6 mentions "Menu Planning in the bottom right" — refers to deleted ChatbotWidget (Task #19, commit 88aeaaa). User-facing broken reference. | **P0 (broken content)** | Delete the "Click 'Menu Planning'" clause. Keep the "Contact ITS at itservices@mymanatee.org" half. |
| searchIndex.ts | 80-88 | `techniqueMap` routes are all wrong post-renumbering. "zero-shot" → ch01 (What Is a Prompt — not zero-shot). "few-shot" → ch04 (Meeting Notes — not few-shot). "chain-of-thought" → ch05 (Plain Language Converter — not CoT; CoT is ch23). "persona" → ch03 (Email Tone Adjuster — not persona; persona is ch25). "negative prompting" → ch26 (Copilot Tips — not negative; negative is ch27). "task chaining" → ch09 (Meeting Agenda — not task chaining). | **P0 (broken navigation)** | Rebuild techniqueMap with correct chapter IDs: zero-shot/few-shot stay TBD (no dedicated chapters exist); CoT → ch23; persona → ch25; negative → ch27; rtco → ch24. Remove "task chaining" entry or point at ch09 only if it's actually about chaining (it isn't). |
| Resources.tsx | 37-66 | `jumpstartChapters[].chapterId` mappings drift from current chapter numbering. "Ch 8 Negative Prompting" links to ch26 (Copilot Tips). "Ch 11 Image Prompting" links to ch28. "Ch 12 Testing" links to ch29. "Ch 13 Avoiding Bad Answers" links to ch30. The displayed "Ch N" badges don't equal cookbook chapter numbers. | **P1 (confusing UX)** | Either renumber the visible badge to match the linked chapter, or remove the inline chapter number from jumpstartChapters labels. |
| Home.tsx | 2 | Unused imports: `ChevronRight as ChevronRightIcon` and `ChefHat`. Post-refactor dead imports. | P3 (lint) | Remove from import list. |
| ChapterDetail.tsx | 1-25 | Unused imports: `Sparkles`, `User`. (AlertTriangle, Info, ChefHat, Lightbulb all still used.) | P3 (lint) | Remove unused imports. |
| Game.tsx | 5-23 | Imports `Loader2` used in Arena (live mode) and Challenge (analyzing) — fine. Imports `Send` only used in Challenge. All currently used. | — | No action |
| Resources.tsx | 217-220 | Stat badges reference `promptRecipes.length` before its declaration (line 577). Works at render time because module init completes first, but the lexical inversion is fragile and confuses reading order. | P2 (maintainability) | Move `promptRecipes` array above the `Resources` component. |
| Home.tsx | 232, 724, 233 (and other call sites) | `localStorage.setItem("cookbook-builder-import", X); window.location.href = "/builder/"` pattern appears 8+ times across Home, Resources, Sidebar, Game, ChapterDetail, TryItSection. Magic-string duplication. | P2 (DRY violation) | Extract a `sendToBuilder(template: string)` helper into `lib/copilot-handoff.ts` or new `lib/builder-handoff.ts`. |
| Home.tsx | 444 | `<div className="p-4 sm:p-6 lg:p-8 max-w-5xl">` — `max-w-5xl` should be on the outer container or paired with `mx-auto`; without `mx-auto` it has no centering effect (it just caps width to 5xl from the left). | P3 (UX polish) | Add `mx-auto` or verify intent. |
| Home.tsx | 264 | `useState(() => { try { ... } catch { /* */ } return null; })` — empty catch swallows all storage errors silently. Same pattern at 268-273. | P3 (defensiveness) | Replace empty `/* */` with `/* ignore quota errors */` comment or log to a debug channel. Same for the localStorage writes. |
| Home.tsx | 313-315 | Hashchange listener inside an effect that depends on `addRecentItem` — re-attaches listener on every render where addRecentItem identity changes. `useRecentlyViewed` likely returns a stable callback; verify. If not stable, this thrashes listeners. | P2 (perf) | Verify `addRecentItem` is wrapped in `useCallback` inside the hook, or wrap usage here in a ref. |
| Home.tsx | 632-639 | Inline `onMouseEnter`/`onMouseLeave` modifying `style.boxShadow` and `style.transform` imperatively on top of framer-motion `whileHover` is redundant and competes with framer-motion's animation engine. | P2 (anti-pattern) | Remove the imperative hover handlers — let framer-motion `whileHover` own the hover state. |
| Resources.tsx | 668 | `(recipe as any).icon` — type-cast escape hatch. The `promptRecipes` array entries include `icon` but the type is inferred so the cast shouldn't be needed. | P3 (lint) | Define a `Recipe` type for the array and drop the cast. |
| Game.tsx | 753 | `useState(() => arenaRounds.map(() => (Math.random() > 0.5 ? "A" : "B") as "A" | "B"))` — randomizes side at mount. Stable across renders inside the same arena session. Fine, but worth a comment. | P3 (clarity) | Add comment: "// Randomize which side shows strong vs weak prompt per round" |
| Game.tsx | 754-792 | Live-mode logic does a sequential effect: useEffect to check `/api/health` (line 788), then a separate useEffect to fetch outputs (line 764). The health check sets `liveMode=true` then triggers the second effect. Race condition: if user advances rounds faster than the API resolves, AbortController cleans up — but `loadingOutputs` may stay true on a stale render. | P2 (race) | Add a `cancelled` flag check before `setLoadingOutputs(false)` in both paths; verify the abort actually clears `loadingOutputs`. |
| Game.tsx | 1375-1407 | `handleSend` in ChallengeMode mutates state inside try/catch + finally. If `response.ok` is false, `setShowReference(true)` still runs in finally — showing the reference even though the AI critique failed. | P2 (UX bug) | Move `setShowReference(true)` into the success branch only, OR check `aiResponse` length before showing reference. |
| Game.tsx | 730-743 | `fetchPreview` constructs response string by joining "Gaps:" + "Unclear:" inline. The function returns formatted text, but no type-narrowing on `data.gaps`/`data.unclear` — assumes server returns arrays. | P3 (defensiveness) | Validate response shape with zod (which already exists in the project for system prompts). |
| Home.tsx | 220 | `navigator.clipboard.writeText(prompt.template)` — no try/catch. On insecure contexts (HTTP) the clipboard API throws. | P3 (defensiveness) | Wrap in .catch with a toast fallback (the pattern in Resources.tsx line 621 does this correctly). |
| Home.tsx | 798 | `nonMatchingGroups.reduce((n, g) => n + g.chapters.length, 0)` — computed every render. Cheap but should live in the useMemo at 348. | P3 (perf) | Move into the existing useMemo. |
| cookbookData.ts | 162, 206, 249, 293, 335, 376, 417, 459, 500, 542 | Source strings claim "Tested, Quality Score X/10" against a "Governance Registry" — if that registry no longer exists post-pivot, these are unverifiable claims. | P1 (broken-if-registry-dead) | See Open Questions Q1. |
| Sidebar.tsx | 247-251 | Special-cases `/builder` paths with `window.location.href = result.href.replace(/^\/builder/, "/builder/")` — fragile string manipulation. Will break if `result.href` is ever `/builder?q=foo`. | P2 (correctness) | Use a typed flag on SearchResult like `result.crossBundle: true`, or check URL with URL constructor. |
| Game.tsx | 1684-1693 | `capstoneSteps` array contains 9 fixed steps but the labels mix "Step 1: ..." prefix into the `label` field, then `capstoneLabels` re-maps to "You are a / Your goal / Context" etc. Two separate label systems for the same 9 steps. | P3 (DRY) | Collapse into one config: each step has `{id, stepNumber, headerLabel, promptLabel, ...}`. |
| Sidebar.tsx | 327-345 | IIFE inside JSX (`{(() => { ... })()}`) renders a taste-test button. IIFEs in JSX are a code smell. | P3 (style) | Extract to a small `PartTasteTestButton` component. |
| ChapterDetail.tsx | 117-123 | `toggleBookmark` mutates the `current` array in place (`current.splice`, `current.push`) before stringifying. Works, but mutation inside a getter-style helper is surprising. | P3 (style) | Use `current.filter(x => x !== id)` and `[...current, id]` for clarity. |
| searchIndex.ts | 32 | Module-level `let _index: IndexEntry[] | null = null` cached singleton — fine for SPA, but if HMR replaces the file the cache survives. Edge case in dev. | P3 (dev DX) | Acceptable; leave a comment. |
| Resources.tsx | 716 | `TRAINING_RECIPIENT = "elliot.jarbe@mymanatee.org"` — hard-coded personal email. Will need to change if Elliot leaves or workgroup mailbox is preferred. | P2 (config) | Move to `.env` or a named workgroup mailbox like `ai-workgroup@mymanatee.org` (already referenced as the canonical address in `internalResources` line 111). |

---

## Part 3 — Prioritized Strip-Back List

### DELETE (no Builder-supporting purpose)

1. **All taste tests + tier ladder** — `tasteTests.ts`, `useTasteTests.ts`, `TasteTestModal.tsx`, the tier badge UI in `Home.tsx` (lines 485-570), taste-test buttons in `Sidebar.tsx` (327-345). Removes the chef-progression gamification overlay that the user flagged.
2. **Prompt Lab — Arena and Anatomy modes only** — `Game.tsx` BlindArena (745-1061) and PromptAnatomy (1067-1337). Pure quizzes with no Builder integration.
3. **Hero stats strip** — `HeroSection.tsx` lines 72-90. Catalog framing.
4. **Resources stat badges** — `Resources.tsx` lines 217-235. Same framing.
5. **`stats` export from `cookbookData.ts`** — lines 1359-1364. Stop publishing the count.
6. **Chapters ch17, ch18, ch19, ch22** — meta-content about the cookbook's own governance system. Doesn't teach prompting; teaches users to admire the scaffolding. Move ch19 (Audit Trails) content into Resources → Internal tab as a single bullet if compliance officers need it.
7. **OnboardingBanner step 6 "Menu Planning" reference** — P0 broken content (Home.tsx line 111).
8. **Portal.tsx "practice lab" mention** — line 97. Becomes a dead reference once Lab is removed.

### REFACTOR (rewrite for Builder-as-primary framing)

1. **OnboardingBanner step 4** (Home.tsx 104-106) — rewrite as "Use the Prompt Builder to assemble a Copilot-ready prompt in 2 minutes." Drop the lab references.
2. **Resources Jumpstart course (14 lessons)** — `Resources.tsx` 37-66 + CoursesTab. Either (a) cut to 5 essentials, or (b) derive lessons programmatically from `chapters[]` so there's one source of truth. Current state is a duplicate content stream.
3. **Section dividers** (Home.tsx 29-34) — replace "START HERE / EVERYDAY USE / GOING DEEPER / GOVERNANCE & HORIZON" with neutral labels ("Foundations / Templates / Use Cases / Governance"). Strip the journey framing.
4. **searchIndex.ts techniqueMap** — every entry is mis-routed post-renumbering. Fix the chapter IDs (CoT→ch23, Persona→ch25, Negative→ch27, RTCO→ch24) or remove the map entirely.
5. **Capstone mode** — promote into Builder as a first-run "show me how" wizard. Cleanest fit: it's already 9 RTCO+++ steps with a "Try in Builder" CTA — it IS Builder onboarding.
6. **ChallengeMode** (Game.tsx 1343-1674) — if kept at all, merge the `/api/critique` flow into Builder as a "test your prompt" feature on the Builder page itself.
7. **quickActions in Home.tsx** — drop the Prompt Lab tile. Replace with a second Builder-supporting tile (e.g., "Recipe Library" pointing at /resources?tab=recipes).
8. **`sendToBuilder` helper** — extract the 8 duplicated `localStorage.setItem + window.location.href = "/builder/"` call sites into one function.
9. **`TRAINING_RECIPIENT` email** — change from personal address to `ai-workgroup@mymanatee.org` to match what `internalResources` already documents (Resources.tsx line 111).

### KEEP (genuinely supports Builder)

1. **Hero "Open Prompt Builder" CTA** (Home.tsx 577-604) — model the rest of the page on this.
2. **Prompt of the Week** (Home.tsx 119-248) — already Builder-propellant via "Open in Builder" button.
3. **Department case studies** (Home.tsx 672-737) — strong Builder propellant.
4. **All 15 Resources recipes** (Resources.tsx promptRecipes) — strong Builder propellant via "Use in Builder".
5. **govResources + internalResources** in Resources.tsx — supporting reference content.
6. **Chapters ch01-ch16, ch20-ch21, ch23-ch30** (26 chapters total) — supports-Builder material.
7. **RecipeCard, ChapterDetail "Try this in Builder" affordances** — already in place.
8. **Department picker + personalization system** — primary affordance for relevance filtering.
9. **Search (Sidebar)** — needed for quick lookups (after the techniqueMap fix).
10. **Recently Viewed** (Home.tsx 663-667) — return-user shortcut.

---

## Part 4 — Game.tsx Specific Verdict

**Recommendation: Split, don't binary-cut.**

The 4 modes don't share a thesis. Classify each on its own:

| Mode | LOC | Builder connection | Verdict |
|---|---|---|---|
| BlindArena | ~315 | None (TechniqueActions panel after reveal does link out, but interaction is self-contained voting) | **CUT** |
| PromptAnatomy | ~270 | None (same — links appear only on reveal) | **CUT** |
| ChallengeMode | ~330 | Uses `/api/critique` to score user-written prompts vs reference. Builder-adjacent — but parallel to Builder, not integrated. | **CUT or MERGE INTO BUILDER** |
| CapstoneMode | ~320 | 9-step RTCO+++ wizard with explicit "Try in Builder" CTA. Functionally an onboarding wizard for Builder. | **MOVE INTO BUILDER** as a first-run guided mode |

**Why this beats full-cut:**
- The 9 capstone steps are the only place that walks a user through the full RTCO + reasoning + constraints + uncertainty handling stack. Builder has the same blocks but no narrative explaining when to use each. Capstone fills that gap.
- The critique pattern in ChallengeMode (call `/api/critique`, show side-by-side reference) is a feature users would want INSIDE Builder ("how does my prompt compare to expert?"). Don't throw away the working API integration.

**Why CapstoneMode is the keeper:**
1. Each step IS a Builder block (Role / Goal / Context / Examples / Reasoning / Format / Constraints / Negative / Uncertainty)
2. Each step has educational tip text — the type of inline coaching Builder needs but lacks
3. Final preview screen already has "Try in Builder" CTA
4. The same data structure could power a first-run wizard inside Builder with no logical re-engineering

**Concrete proposal (not for this audit, but to capture the recommendation):**
- Delete `BlindArena`, `PromptAnatomy`, the `/game` route, the `ModeSelection` page, and `TasteTestModal` (already covered above)
- Move `capstoneSteps`, `capstoneLabels`, `CapstoneMode` rendering logic into Builder as a `<BuilderWizard />` component
- Move `TECHNIQUE_LINKS` map into a shared lib file so other pages can use it
- Move `/api/critique` integration into Builder as a "Test prompt" affordance, drop ChallengeMode

**Net effect:** ~2,200 lines of Game.tsx become ~300 lines absorbed into Builder. The lab disappears as a destination; Builder becomes the only daily-use tool.

---

## Part 5 — Open Questions for Elliot

1. **Q1 — Is the "AI Governance Registry" live or aspirational?** Ten Part II chapters (ch03-ch12) cite "Source: Governance Registry: X v1 — Tested, Quality Score 9.6/10". Same for `qualityScore` field values (9.2-9.6). If the registry is real → keep, optionally surface. If aspirational/cut → these claims are unverifiable and should be removed from `source` and `qualityScore` fields. (33 occurrences across cookbookData.ts.)

2. **Q2 — Should the "AI Working Group" framing stay?** Multiple chapters and the Internal tab reference "the AI Working Group" as a real body that meets bi-weekly. If that group exists, it's a legitimate touchpoint. If it doesn't, it's an aspirational claim that should be reworded.

3. **Q3 — Is `/game` URL accessible from somewhere external?** If county-side training materials, presentations, or emails link to `mymanatee.org/cookbook/game`, deleting it creates broken external links. Audit before deletion.

4. **Q4 — Capstone wizard in Builder: replace or augment?** Two options: (a) the Builder page shows the wizard the first time a user visits, then falls back to the standard block UI; (b) wizard is always available as a "Walk me through it" mode toggle. Recommend (b) — beginners may want guided mode every time.

5. **Q5 — `TRAINING_RECIPIENT` change from personal to workgroup mailbox.** Should `elliot.jarbe@mymanatee.org` (Resources.tsx line 716) become `ai-workgroup@mymanatee.org`? Internal docs (line 111) already say to email the workgroup address.

6. **Q6 — The 14-lesson "Cookbook Foundations" Jumpstart course vs the 30 chapters.** They're two parallel teaching streams. Recommend collapsing to one. Question: which one is authoritative? The Jumpstart lessons are shorter and punchier; the chapters are deeper and have personas. Both are good content but maintaining both is overhead.

7. **Q7 — Should the Tier badge gamification ("Starter → Executive Chef") stay if reframed as a "did you complete onboarding?" indicator?** Current implementation ties tier to taste-test completion. If taste tests die, tier dies. Probably DELETE — but flag in case onboarding completion tracking is a separate ask.

8. **Q8 — Department count discrepancy.** `departments.ts` defines 12 categories. Resources.tsx says "Resource Board" without mentioning count. Home.tsx hero stats render "12 departments" (correctly, from `departments.length`). The user's task description said "12 departments" — confirming the 12 figure. So the hero stat is factually correct — the question is whether it should be SHOWN. (Recommended: cut, see Part 3.)

---

## Summary stats

- **30 chapters audited:** 1 propels-to-Builder, 25 supports-Builder, 4 loops-inward, 0 broken (PII separately audited)
- **6 audit-target files for Home + Resources + Game content items:** 38 content items classified
- **Code findings:** 1 P0 (broken Menu Planning ref), 4 P1 (techniqueMap routing wrong, jumpstart chapter ID drift, Governance Registry verifiability, training email), ~15 P2/P3 (DRY, lint, perf, defensiveness)
- **Estimated strip-back surface:** ~2,500 lines removable from Game.tsx (Arena + Anatomy + Challenge + ModeSelection); ~150 lines removable from Home.tsx (tier UI + onboarding cleanup); ~50 lines removable each from Resources.tsx, Sidebar.tsx, HeroSection.tsx; full deletion of `tasteTests.ts` (279 lines), `useTasteTests.ts`, `TasteTestModal.tsx`
- **Game.tsx specific verdict:** Cut Arena + Anatomy + ModeSelection. Merge Challenge critique flow + Capstone wizard INTO Builder. Net ~300 lines absorbed, ~1,900 deleted.

---

## Investigation-only — no changes made

Per task instructions, this audit made no code changes, no deletions, no commits. The report is the deliverable. Action items above are recommendations for Elliot's approval; each would land as a separate task in the next SDD cycle.
