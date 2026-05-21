# Plan — No-Fabricated-Data remediation (cookbook)

**Date:** 2026-05-19 · **Branch:** `feat/cookbook-mvp` · **Repo:** `~/Projects/prompt-cookbook-gov-mvp`
**Execution:** subagent-driven-development (implementer + spec + code-quality gates per task).
**microservices-architect:** no angle — pure content/data remediation, no boundaries.
**Source of truth:** the 2026-05-19 forensic audit (62 items; file:line in this plan's task specs).

## Approved decisions
- 3 must-fixes: greenlit.
- **A** = genericize the 8 Builder template contexts to bracketed placeholders (label doesn't survive copy/paste; the value itself must not read as real).
- **B** = contradiction reconciled by REMOVING the unverifiable version/status from BOTH sides (I have no fact on whether a Handbook v1.0 ships; I will not guess). User can re-add a real version later.
- **C** = framework names → honest "aligned with … such as NIST AI RMF" (no causal/derivation claims); remove bare `Author et al. YYYY` provenance cites + the 9-name "Sources:" footer.

## Tasks (sequential, review-gated)

### T-R1 — Remove the 19 fabricated quality scores (TDD: guard-test-first)
`client/src/lib/cookbookData.ts`. RED→GREEN: first add a guard test (extend `cookbook-v2-strip.test.ts` or a new `no-fabricated-claims.test.ts`) that FAILS when any user-facing prose field (`summary`, `content[]`, `keyTakeaways[]`) of any chapter matches fabricated-metric patterns: `/quality score/i`, `/\b\d(\.\d+)?\s*\/\s*10\b/`, `/\b\d{2,3}%\s*(test )?pass rate/i`, `/accuracy score:/i`, `/9-dimension rubric/i`, `/production-tested/i`. Watch it FAIL on the 19 known lines (166,177,213,220,268,300,309,342,351,383,392,424,433,466,476,507,517,549,559 + the 161 "production-tested" summary). Then DELETE those fabricated sentences/clauses (remove the claim cleanly; keep the surrounding legitimate prose readable — do not invent replacement praise). Re-run: test GREEN, full suite green. Nothing backs these (`qualityScore` is `null` repo-wide; no rubric/registry/tests exist).

### T-R2 — Derive counts, kill hardcoded literals
`client/src/pages/Home.tsx:136` "30 chapters" is factually WRONG (actual 26). Replace with a value derived from the chapter data (`chapters.length`-style), so it can never drift. Same treatment for `Resources.tsx:337` "14 lessons" (derive from the lessons array) and `Home.tsx:139` "9-step capstone" — verify against actual capstone data; if unverifiable, drop the specific number rather than assert it. No hardcoded quantity literals asserting content size.

### T-R3 — Citations (C) + Handbook (B)
`cookbookData.ts` `source:` fields + header comment, `Home.tsx:540` footer, `Resources.tsx:72-76,94`, `Home.tsx:142`.
- Remove bare `Wei et al. 2022` / `White et al. 2023` style provenance cites and the 9-authority "Sources:" footer (imply unverifiable content origin).
- Reframe NIST/NACo/GovAI/etc. from causal claims ("the foundation of Manatee's system", "referenced in Manatee's framework") to honest non-asserting language ("aligned with widely-used public-sector frameworks such as NIST AI RMF"). Keep real external URLs (govai.org etc.) — those are verifiable links, not fabricated claims.
- **B:** strip `(v1.0)` from `Home.tsx:142` and "being finalized" from `Resources.tsx:94` — both unverifiable. State only what's true without a version/status qualifier. Leave a `<!-- TODO: add official Handbook version if/when confirmed -->`-style code comment (not user-visible) noting the user must supply the real status.

### T-R4 — Genericize 8 Builder template contexts (A)
`client/src/pages/Builder.tsx` template `context` fields ~lines 147,151,153,157,161,168,171,173. Replace concrete county-looking figures with bracketed placeholders the user fills (`[N] potholes repaired`, `$[X] of $[Y] annual budget`, `[NNN] total calls`, `RFP #[NUMBER]`, `[DATE RANGE]`). Keep them useful as template scaffolds; ensure no value reads as a real Manatee figure even if pasted with no label. Do NOT touch `departments.ts` caseStudies (they render under explicit Weak/Strong teaching labels — ILLUSTRATIVE-LABELED, out of scope).

## Per-task acceptance
`pnpm run check` clean · `pnpm test` green (≥132 + new guard test) · `pnpm build` 3 bundles · spec reviewer: matches this task, nothing extra · code-quality reviewer: approved. Final: full-content re-grep confirms 0 fabricated-score / 0 bare-provenance-cite / 0 hardcoded-content-count / 0 unlabeled real-figure context.

## Out of scope
departments.ts caseStudies & tryIt suggestions (ILLUSTRATIVE-LABELED), real Florida statutes used correctly in example templates, the (already-held) prior scrub removals.
