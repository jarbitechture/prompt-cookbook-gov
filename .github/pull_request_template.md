# Cookbook Content PR Checklist

Complete every item before requesting review. Items marked **REQUIRED** block merge.

## Content integrity

- [ ] **REQUIRED** — Source cited: every claim added or changed in `cookbookData.ts` or `Resources.tsx` has an inline comment (`// source: ...`) or is documented in the commit message.
- [ ] **REQUIRED** — No real PII: no real employee names, email addresses, or ID numbers appear without written consent (per Task #15 — see `docs/superpowers/plans/2026-05-12-cookbook-mvp.md §6 Task #15`).
- [ ] **REQUIRED** — Personas labeled as fictional: any new persona added to `cookbookData.ts` or `Resources.tsx` is explicitly fictional (see the Resources page note: "Personas in this cookbook are fictional examples used for illustration").

## Hallucination defense

- [ ] **REQUIRED** — Banned-claims regex clean: the `content-checks` workflow `banned-claims` job passes. No Florida statute citations, large dollar amounts (`$NM`/`$NB`/`$NK`), ordinance/code-section decimal references, or FY budget keywords appear unguarded in cookbook content files. If a legitimate reference is needed, wrap it in a `[REDACTED:...]` marker or open a discussion with the reviewers.
- [ ] If this PR modifies `server/prompts/*.md`: an ADR in `docs/adr/` justifies the change to the system prompt, OR the change is a typo/formatting fix that does not alter the domain lock, refusal pattern, or output schema. Check the ADR box below.

## Schema and ADRs

- [ ] If `server/schemas/*.ts` changed: the corresponding `server/prompts/*.md` output-schema block still matches the zod type. Update both atomically.
- [ ] If `docs/adr/` changed: the ADR is numbered sequentially (next after the highest existing `ADR-NNN`), has Status set, and references the PR.

## Observability

- [ ] **REQUIRED** — ROI events tagged: any new server endpoint or agent invocation emits an ROI event with all required fields (`event_kind`, `workflow`, `user_id`, `dept`, `role_band`, `task_type`, `tool`, `surface`, `duration_s`, `success`). See Operating Rule #18 and `server/lib/roi-emit.ts`.

## CI gates

- [ ] `pnpm test` passes (all vitest + server tests green).
- [ ] `pnpm run check` passes (TypeScript type-check clean).
- [ ] `pnpm run build` succeeds (no bundler errors).
- [ ] Link-check job passes (`content-checks` workflow — dead URLs fail the build).

## Reviewer note

This PR touches files covered by CODEOWNERS. At least one of @matt-TBD, @keith-TBD, or @chris-TBD must approve before merge.
