# Plan — Standalone Builder "Precision Instrument" identity (#3)

**Date:** 2026-05-18 · **Branch:** `feat/cookbook-mvp` · **Repo:** `~/Projects/prompt-cookbook-gov-mvp`
**Execution:** subagent-driven-development (typed implementer + spec review + code-quality review per task)

## Context / why

Builder was decoupled from Cookbook earlier this session (#2/#4). It is its **own
Vite bundle** (`build:builder` → `dist/builder`, base `/builder/`, separate IIS
Application) and already does **not** import the shared `@/lib/theme`. It still
wears ad-hoc warm/cookbook-ish colors with one blue accent bolted on. #3 gives it
a deliberate distinct identity.

**microservices-architect verdict (settled):** boundary already clean — this is
**intra-builder-bundle** work, no new service boundary, no decomposition. **Hard
constraint:** keep Builder's theme **local to the builder entry** — do NOT add a
shared theme import (would re-couple Builder to Cookbook/Portal). No further
microservices angle (pure-visual otherwise).

## Decided direction — "Precision Instrument" (user-selected)

Cool, tool-like, IDE-calm. Deliberate opposite of Cookbook's warm chef/recipe feel.

| Token | Value | Use |
|---|---|---|
| `bg` | `#F7F8FA` (cool near-white) | page background |
| `surface` | `#FFFFFF` | block/panel surfaces |
| `ink` | `#1B2230` (slate) | primary text |
| `ink-muted` | `oklch(0.45 0.02 250)` | secondary text |
| `accent` | `oklch(0.48 0.12 220)` (existing blue) | active state, focus, primary action |
| `accent-soft` | `oklch(0.94 0.03 220)` | subtle accent fills |
| `hairline` | `1px solid oklch(0.90 0.01 250)` | borders (replace shadows) |
| preview pane | keep existing ink/terminal dark | unchanged |

Rules: **no warm tones** (drop the `oklch(.. 70/55/45)` warm hues in Builder),
**no serif headers** (sans, tighter), **no card drop-shadows** (hairline borders
instead), **tighter density**, **mono labels** on the RTCO block headers. Keep
the dark "Live Preview" terminal pane as-is (already on-identity).

## Tasks (independent-ish, sequential, review-gated)

**T1 — Local theme token module.** Add `client/src/builder-theme.ts` (or a
constants block in the builder entry) exporting the tokens above. No
`@/lib/theme` import. Pure additive. Unit-touch only.

**T2 — Shell/chrome.** Builder page bg, top bar ("Building for…", Copy/Use-in-
Copilot/ChatGPT row), "Prompt Blocks" header, Reset, scorecard dots → tokens;
remove serif headers + card shadows → hairline.

**T3 — RTCO block cards.** The 5 blocks (Role/Task/Context/Output/Constraints):
slate surface, hairline border, mono uppercase block label, tighter padding,
accent only for active/focus. Keep the per-block colored left-rule but desaturate
to the cool family.

**T4 — Live Preview + Critique/Refine/Preview panels.** Keep dark terminal
preview; retheme the C/R/P tab strip + result/empty/error states to the
instrument palette (no warm).

**T5 — Template Gallery + buttons + consistency sweep.** Gallery accordion,
remaining buttons, focus-visible rings = accent, final no-warm-leftovers pass.

**Final:** full-bundle code review + `pnpm build` + `pnpm run check` + 120/120;
then user does the visual/UX pass (only valid layout verification — not my
screenshots, per the logged rule).

## Acceptance per task
- `pnpm run check` clean, `pnpm test` 120/120, `pnpm build` OK.
- No `@/lib/theme` import in any builder-bundle file (grep gate).
- No remaining warm-hue oklch (hue ~40–75) in touched Builder files.
- Spec reviewer: matches the token table + rules, nothing extra.
- Code-quality reviewer: approved.

## Out of scope
Functionality (Critique/Refine/Preview logic — already fixed this session),
Cookbook/Portal/Resources visuals, routing, the Refine residual.
