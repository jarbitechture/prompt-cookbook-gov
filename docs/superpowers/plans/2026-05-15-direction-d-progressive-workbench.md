> # ⛔ KILLED 2026-05-15 — DO NOT EXECUTE
>
> This spec's entire premise — "the two-column workbench fails the first-time
> clerk / makes no sense" — was a **rendering artifact**, not a real layout
> defect. Servo on a Retina Mac could not produce a ≥1024px CSS viewport, so
> every screenshot was the mobile single-column fallback. The two-column layout
> was later proven correct via deterministic Playwright geometry (1440px:
> grid-template-columns 585/479px, columns side-by-side) and merged as #37.
>
> D1–D3 (guided first-run) and D5–D7 (margin-coach) were both justified solely
> by that false premise — no independent evidence. The guided-first-run idea
> survives ONLY as a falsifiable hypothesis, gated on direct observation of a
> real first-time county clerk failing the working two-column layout. Until
> that observation exists, this is not work. Kept for history, not as a plan.

# Direction D — Progressive Workbench + Margin Coach (SDD spec)

**Date:** 2026-05-15
**Branch:** `feat/builder-two-column` (worktree `~/Projects/prompt-cookbook-gov-mvp-2col`)
**Base:** Task #37 two-column workbench, U1–U8 committed, 120 tests green (HEAD `c930418`)
**Model tier:** Sonnet (UI restructure + 2 net-new components; not architecture-level)
**Origin:** GUI research deliverable, 2026-05-15. Direction D chosen.

## Why

The two-column workbench (Task #37) is the right *steady state* but fails the first-time county clerk: seeing 5 RTCO blocks + coach tabs + live preview at once is the "makes no sense" complaint that killed the prior single-column attempts. Direction D adds a guided first-run that *is* the onboarding (delivered as product, not a tour), then progressively unfolds to the dense workbench once the user has produced one prompt. The coach surface changes from a tab-strip to a Grammarly-style margin model so the tool structurally cannot be mistaken for a chatbot.

## The three hard gates (design self-checks → acceptance criteria)

Every unit's work must preserve these. Final verification asserts each explicitly:

1. **No single-column scroll.** First run = paced steps (one view per step). Steady state = two-pane workbench. Neither is the failed vertical stack.
2. **Cannot be mistaken for a chatbot.** No message thread, no input-at-bottom, no turn-taking. The artifact is a structured prompt the user owns; AI appears as margin annotations + an explicit technique tray.
3. **Untrained clerk completes one prompt + hands to Copilot.** First visit forces the guided flow: plain-language Role→Task→Context one at a time, auto-assembles, auto-runs one Critique, ends on a single prominent "Copy & open Copilot" button. No tour, no jargon.

## Units (9, ~15-min each, sequential, one commit per unit)

### Phase 1 — Guided first-run flow

**D1 — `GuidedFlow.tsx` component (paced 3-step).**
New file `client/src/components/GuidedFlow.tsx`. Three steps, one view each: (1) Role — "Who should the AI act as?", (2) Task — "What do you need done?", (3) Context — "What background does the AI need?". Plain-language label + one textarea + Back/Next. Progress dots (1 of 3). No RTCO jargon visible — the words "Role/Task/Context" appear as friendly questions, not field names. State is local; on completion it returns `{ role, task, context }` to the parent.
*Verify:* strict_tdd — failing test for step state machine (next advances, back regresses, can't next past 3, can't back before 1) → implement → green. Servo screenshot of step 1.

**D2 — Auto-assemble + auto-Critique on guided completion.**
On step-3 Next, assemble the three answers into the standard prompt structure (reuse the existing `assembledPrompt` builder; Output Format + Constraints default to sensible boilerplate the user can edit later). Immediately call `/api/critique` once and render the result inline below the assembled prompt — read-only, friendly framing ("Here's how your prompt looks and one thing to tighten").
*Verify:* mock the critique call in test; assert assembled prompt contains all three answers; Servo screenshot of completion state with critique shown.

**D3 — Guided flow terminal CTA.**
The completion view ends on ONE prominent primary button: "Copy prompt & open Copilot ↗" (reuse existing `sendToTarget` + PII pre-flight). Secondary, quieter: "Keep editing in the full builder →" (sets the welcome flag and unfolds to workbench — see D4). No other competing actions on this view.
*Verify:* clicking primary fires clipboard + window.open + ROI event (existing path, unchanged); Servo screenshot.

### Phase 2 — Progressive unfold

**D4 — Gate first-run vs workbench on `welcomeStorage` (U5 flag).**
Builder root reads `getWelcomeSeen()` (existing helper, `WELCOME_KEY="builder-welcome-seen"`). No flag → render `GuidedFlow`. Flag set → render the two-pane workbench (existing U1–U8 layout). The guided flow's "Keep editing" CTA and the act of completing one prompt both call `setWelcomeSeen()`. Workbench header gets a quiet "↩ Guide me again" toggle that clears the flag for the current session only (does not persist — re-running the guide is a help action, not a reset).
*Verify:* strict_tdd — clear localStorage → GuidedFlow renders; complete flow → flag set → reload → workbench renders; click "Guide me again" → GuidedFlow renders without clearing persisted flag. Servo screenshots of both states.

### Phase 3 — Margin coach (replaces U4 tab strip)

**D5 — Critique as inline markers + right-margin cards.**
Replace the workbench right-pane tab strip (U4) with a margin layout. The assembled prompt renders as the central artifact with five labeled, collapsible sections. Critique results render as: colored left-border markers on weak sections + a right-margin stack of cards (one per `specificity_issue` / `suggestion`). Each card has Accept (applies the suggestion to the relevant block, same wiring CritiquePanel already uses) and Dismiss (removes the card). Do NOT modify `CritiquePanel.tsx` internals — wrap/re-present its data in the margin layout.
*Verify:* Accept on a card mutates the corresponding block value; Dismiss removes only that card; existing 120 tests still green; Servo screenshot.

**D6 — Refine as a compact margin technique tray.**
The 6 plain-language technique cards (from Task #36, `RefineDiff.tsx`) become a compact vertical tray in the same right margin, below the Critique cards, under a "Refine with a technique" header. Clicking one runs `/api/refine` with the `technique` key and shows the diff in a focused slide-over (not a stacked panel). Accept replaces the artifact; Reject closes the slide-over. Reuse `RefineDiff` internals; only the container/trigger changes.
*Verify:* clicking a tray technique fires `/api/refine` with correct `technique` key (the Task #36 + `fa57132` focus-directive path); diff slide-over opens; Accept updates artifact. Servo screenshot of tray + open slide-over.

**D7 — Preview as a slide-over (not a tab).**
"Preview how this lands" becomes a single button in the margin (below the Refine tray). Clicking it slides over a panel rendering the existing PreviewPanel data, with the simulation disclaimer banner intact. Closing returns to the artifact untouched. Reuse `PreviewPanel` internals.
*Verify:* button opens slide-over; disclaimer visible; close restores artifact; Servo screenshot.

### Phase 4 — Visual discipline + verification

**D8 — USWDS-discipline aesthetic for Builder chrome.**
Apply a credibility-first visual base to GuidedFlow + workbench chrome (NOT the Cookbook's chef-pig warmth — that stays on `/cookbook`, this is `/builder`): system font stack, high contrast, one deep county-blue primary accent, generous spacing, near-zero ornament/motion. Reuse `theme.ts` tokens where they fit; add a minimal set of new tokens ONLY if no existing token matches (document each). The three coach accent colors (blue/green/purple) stay for the margin cards — that's functional color, keep it.
*Verify:* Servo desktop + mobile screenshots side-by-side with Cookbook home to confirm Builder reads as a distinct, more austere/official surface while sharing the brand bar.

**D9 — Verification gate (the 3 hard gates as explicit assertions).**
- `pnpm run check` clean, `pnpm test` ≥120 green (no regression), `pnpm run build` clean (all bundles)
- Servo: `guided-step1.png`, `guided-complete.png`, `workbench-margin.png`, `refine-slideover.png`, `preview-slideover.png` at 1280-logical (no dpr-halving — the prior screenshots were taken below the `lg:` breakpoint, which masked the 2-col layout; use a true wide viewport), plus `mobile-guided.png` + `mobile-workbench.png` at 375.
- Write a `direction-d-checks.md` in the worktree docs/ stating PASS/FAIL with evidence for each of the 3 hard gates.

## Out of scope

- Do NOT modify `CritiquePanel.tsx`, `RefineDiff.tsx`, `PreviewPanel.tsx` internals — only their containers/triggers change (re-present, don't rebuild).
- Do NOT touch any backend (`server/`, `api/`), endpoints, technique-map, prompts, breaker, civic-ai-client.
- Do NOT touch Portal, Cookbook home, or any non-`/builder` route.
- Do NOT touch the Cookbook's chef-pig warmth — Direction D's austerity applies to `/builder` only.
- Do NOT delete or weaken any existing vitest test.
- Do NOT add dependencies — Tailwind, framer-motion, Lucide already present.

## Sequencing + dispatch

Single Sonnet SDD subagent, sequential, in the existing worktree on `feat/builder-two-column` (N=1, no new worktree needed). One commit per unit, conventional commits, unit number in the body. Estimated 3–4 hr wall-clock. Retry budget: 1 per unit; BLOCKED report if a unit fails twice.

After D9 green: spec-compliance review → code-quality review → if both pass, merge `feat/builder-two-column` → `feat/cookbook-mvp` (this is when the whole workbench + Direction D lands on the mainline branch together) → push origin + azdo.
