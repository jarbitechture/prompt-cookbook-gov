# Builder UX Overhaul — Design Spec

- **Date:** 2026-05-21
- **Repo / branch:** `prompt-cookbook-gov-mvp` · `feat/cookbook-mvp`
- **Baseline commit:** `a410761`
- **Surface:** the v1 Builder (`client/src/pages/Builder.tsx` + coach panels). Builder bundle only.

## Goal

Apply the 9 changes the user marked on the 2026-05-21 annotated screenshot. Make the Builder
read as a plain, county-employee-friendly tool — drop the "cookbook / mise en place" kitsch.

## Hard constraint

**The current Builder stays exactly as it is.** Every color, the cool-blue accent, the five
block-card colors, the 2-column layout, spacing, animation — unchanged. The only changes are
the 9 items below. Anything not named here is not touched. A reviewer should be able to diff
the result and see only surgical edits.

Design tokens are fixed: `client/src/builder-theme.ts` (`bg`, `surface`, `ink`, `accent`,
`accentSoft`, `hairline`…) and `BLOCK_COLORS` in `Builder.tsx`. No new palette. No new tokens
unless an item below explicitly needs one, and then it composes from the existing ones.

## Layout decision (locked — Option A)

The 2-column grid stays: `grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]`, Prompt Blocks left, Live
Preview right. **No third column.** The removed "Mise en place" hero (item 4) is replaced
in the same spot by a slim full-width **Directions band** (item 5) that sits above the
2-column grid. Below the `lg` breakpoint the two columns stack as they do today; the
Directions band stays full-width on top.

Rejected: a 3-column layout (cramped on a ~1366 px county laptop, pushed Live Preview
off to the side); a single stacked column (pushes Live Preview below the fold while you
type, killing the "live" co-visibility).

---

## The 9 changes

### 1. Header restyle — serif wordmark

- **Now:** `Builder.tsx` ~L296–310. White sticky header, `<Wrench>` in `accent`,
  `<span className="font-sans font-semibold text-sm">Prompt Builder</span>`.
- **Change:** swap `font-sans` → `font-serif` so the wordmark matches the Portal homepage's
  serif treatment (`Portal.tsx` uses `font-serif` for its wordmark). The header background is
  already white (`surface`), which already matches the Portal's near-white header — **no
  color change.** The wrench keeps the cool accent.
- **Not doing:** no subtitle line ("Manatee County · IT Services") — that was invented in an
  earlier mockup and is explicitly out. No warm tint. See open item Q1.
- **Why:** item 1; "companion serif font + colors matching the Portal homepage."

### 2. Move the 3 action buttons to the bottom of the prompt box

- **Now:** `Builder.tsx` ~L643–704. A sticky CTA bar (`position: sticky; top: 48px`) at the
  top of the content area holds **Copy Prompt**, **Use in Copilot ↗**, and the
  **copy for ChatGPT Enterprise** text link.
- **Change:** remove the sticky top bar. Place the three actions at the **bottom of the right
  column**, directly under the Live Preview box and the token count. Restyle from a compact
  right-aligned strip into a normal action row sized for that position.
- **Trade-off (accepted, per the annotation):** the buttons are no longer always-in-view via
  `position: sticky`. They live at the bottom of the prompt box, as marked.
- **Why:** item 2.

### 3. Department banner — conditional

- **Now:** `DepartmentBanner` (`Builder.tsx` ~L195–225) reads `localStorage["cookbook-department"]`
  and **always renders** — either a department or the generic "All Departments" with 🏛️.
  In v1 nothing sets `cookbook-department` (it was set on the cookbook Home page, which v1
  dropped), so it always shows "All Departments" — dead chrome.
- **Change:** the banner renders **only after a template is loaded.** Lift a `loadedTemplate`
  signal into `BuildMode`; on `loadTemplate`, show `Building for: <template category>`
  (e.g. "IT & Data", "Resident Services"). On Reset / no template loaded, render `null`.
- **Label = the template's `category`** (every template has exactly one; unambiguous). See
  open item Q3 if you want a department name instead.
- **Why:** item 3.

### 4. Remove the "Mise en place" hero

- **Now:** `Builder.tsx` ~L706–755 — the `showWelcome` `AnimatePresence` block: 🥘 emoji,
  "Mise en place for your Copilot prompt", "Start with department template" / "Start blank".
- **Change:** remove the block entirely. Remove the `showWelcome` state and the
  `getWelcomeSeen` / `setWelcomeSeen` wiring (`welcomeStorage.ts`); clean the
  `setShowWelcome` calls in `setBlockValue` / `handleReset` / `loadTemplate` / the import
  effects. The Directions band (item 5) takes over the cold-start guidance.
- **Why:** item 4.

### 5. Directions band

- **New:** a slim, full-width band above the 2-column grid, in the spot the hero vacated.
  Compact — a short heading + 5 numbered steps in plain language. Built from existing tokens
  (`surface`, `hairline`, `accentSoft` for the step numbers). Always visible (it's small);
  not a dismissible hero. See open item Q2 for the name and the dismiss question.
- **Draft copy** (you review — item 5 said "I draft, you review"):
  - Heading: **How to use this** *(working title — see Q2)*
  - 1. Pick a template below, or start from blank blocks.
  - 2. Fill in the blocks — Role, Task, Context, Output, Constraints.
  - 3. Watch your prompt build in the Live Preview.
  - 4. Run **Critique** to catch weak spots, then **Refine**.
  - 5. Copy the finished prompt into Copilot or ChatGPT Enterprise.
- **Why:** item 5.

### 6. De-cookbook the block language + fix faint helper text

- **Now:** `ALL_BLOCKS` (`Builder.tsx` ~L81–87) — each block has a `subLabel` with a chef
  metaphor: "🎩 … (the chef's hat)", "📋 … (the recipe)", "🥫 … (the pantry)",
  "🍽️ … (the plating)", "🚫 … (allergies & dietary restrictions)". The per-block
  `helpText` renders faint: `text-[11px] italic` in `INK_MUTED` (`Builder.tsx` ~L861–864) —
  the user reports it is barely readable.
- **Change:**
  - Replace each metaphor `subLabel` with a plain one-liner — Role → "Who the AI should act
    as", Task → "What you need done", Context → "Background the AI needs", Output Format →
    "How the result should look", Constraints → "Limits and rules to follow". Drop the
    emoji. (See Q4 — alternative is to drop `subLabel` entirely since `helpText` overlaps.)
  - Fix the helper text contrast: darken from `INK_MUTED` to `ink` (or a darker muted token)
    and drop `italic`. Keep the small size.
  - Scan the rest of `Builder.tsx` for stray cookbook words (recipe / pantry / plating /
    chef / mise) and replace with plain wording.
- **Why:** item 6.

### 7. Anti-hallucination clause — reframe (no pipeline bug)

- **Investigated:** `handleCritique` (`server/lib/llm-endpoints.ts` L269–378) sends the real
  assembled prompt to the LLM as the user message; `critique.md` instructs the model to set
  `anti_hallucination_clause: true` only if the prompt contains a "cite sources / only use
  the document / don't make up facts / if unsure say so" instruction. **The pipeline is
  correct.** County RTCO prompts built from the 5 blocks almost never contain such a line,
  so `false` ("Clause missing") is genuinely accurate most of the time. It is not a bug —
  it reads as one because the UI presents it as a red `ShieldOff` "missing" failure.
  (Caveat: the dev model `gemma3:4b` is weak and may under-detect even when a clause is
  present; prod Qwen2.5-7B is the real test. Server unchanged either way.)
- **Change (client only, `CritiquePanel.tsx` ~L388–405):** reframe the "Anti-Hallucination
  Clause" section. When `false`, drop the alarm styling — present it as an actionable
  recommendation: "Anti-hallucination line — not added yet" + a one-click **Add** button
  that appends a standard clause to the Constraints block (reuse the existing
  `onApplySuggestion` path). Standard clause text: *"If any fact is unavailable, say so —
  do not guess or invent details."* When `true`, show a calm positive state.
- **Why:** item 7.

### 8. SBAR template

- **New:** one entry appended to the `templates` array (`Builder.tsx` ~L144–174).
  `category: "IT & Data"`, `icon: Database`, `id: "sbar-draft"`, `label: "SBAR Draft"`.
  RTCO content is the user-approved mapping from the session handoff:
  - **role:** "You are a Business Analyst and Business Relationship Manager on the BA/BRM
    team in Manatee County IT Services."
  - **task:** "Take the intake information below and produce a draft SBAR — Situation,
    Background, Assessment, Recommendation — for the Project Management Office."
  - **context:** county environment (M365 + Copilot, SharePoint Online, Entra ID SSO, Halo
    ticketing, IT Policy R-18-159, AI Policy AI-001, F.S. Ch.119 public records, security
    assessments for new vendor software) + intake placeholders `[DEPARTMENT]`,
    `[WHAT THEY USE TODAY]`, `[VENDOR IF NAMED]`, `[SENSITIVE DATA FLAGS]`,
    `[KNOWN CONSTRAINTS]`.
  - **output:** "Four sections — Situation / Background / Assessment / Recommendation.
    Bullet points, not paragraphs. Under 2 pages."
  - **constraints:** "Mark researched facts `[RESEARCHED]`, gaps `[NEEDS INVESTIGATION]`.
    Do not invent details about what the department wants. A straightforward known-solution
    upgrade → say so. Write like a county BA — direct, no filler."
- **Guard:** the new context strings must pass `client/src/lib/content-integrity.test.ts`
  (the Class-4 fabrication guard re-pointed to Builder template contexts in `020b737`).
  Policy refs (R-18-159, AI-001, F.S. Ch.119) appear as instructions to the model, the same
  shape as existing templates citing the Florida Building Code / Chapter 119 — expected to
  pass; verify on implementation.
- **Why:** item 8.

### 9. Live Preview box — light redesign

- **Now:** `Builder.tsx` ~L1080–1093 — the assembled-prompt pane is a dark terminal:
  `background: oklch(0.14 0.02 240)`, monospace, light text, labels colored via
  `PREVIEW_LABEL_COLORS` (a dark-pane-only palette).
- **Change:** drop the dark terminal look. Light, county-friendly box. Layout follows the
  Nick Babich "Prompt format" reference (2026-05-21 screenshot): each RTCO section is a row —
  **left:** the section label ("Role", "Task"…) in its block color + a tiny sub-description;
  **right:** the filled content in a soft color-coded block. Reuse the existing `BLOCK_COLORS`
  (`bg` / `border` / `text` — already light tints, hue 210–315) instead of
  `PREVIEW_LABEL_COLORS`. Light surface background, hairline border. Friendly light empty
  state replaces the dark placeholder.
- This is the one item that is a genuine visual redesign. See open item Q5 — I can build a
  focused mockup of *just this box* (real tokens) before implementing, or work from this
  description.
- **Why:** item 9.

---

## Open items for your review

- **Q1 — Header (item 1):** serif wordmark, header background stays white (already matches
  the Portal). Confirm you do **not** want any other header color change (no warm tint).
- **Q2 — Directions band (item 5):** name — "How to use this" / "Directions" / "Quick start"
  / "Getting started"? And: always visible (recommended — it's slim), or dismissible?
- **Q3 — Department banner (item 3):** label shows the loaded template's **category**
  ("IT & Data" etc.). Recommended over a department name because it is unambiguous. OK?
- **Q4 — Block sub-labels (item 6):** replace the chef metaphors with plain one-liners
  (recommended), or drop the `subLabel` line entirely and rely on `helpText`?
- **Q5 — Live Preview (item 9):** want a focused real-token mockup of just the redesigned
  box before implementation, or proceed from the description above?

## Out of scope

- The civic-ai gate-zero blocker (`infer01:8100`) — deploy concern, not this overhaul.
- The `dist/prompts` prod build gap noted in `llm-endpoints.ts` — separate issue.
- Any cookbook-bundle file (Home, Resources, ChapterDetail…) — v1 is Builder-only.
- Server / schema changes — all 9 items are client-side except item 7, which is also
  client-only (the server pipeline is already correct).

## Testing

- `pnpm run check` (tsc) clean.
- Existing Vitest suite green (146/146 baseline), including `content-integrity.test.ts`
  after the SBAR template is added.
- Layout truth verified with Playwright headless at an explicit 1440 px viewport
  (Servo on this Retina Mac cannot produce a real desktop viewport).

## Next step

On approval → `superpowers:writing-plans` to decompose these into implementation tasks
(`docs/superpowers/plans/`), then SDD execution.
