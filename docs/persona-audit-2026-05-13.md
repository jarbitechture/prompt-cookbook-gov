# Persona PII Audit — Manatee County Prompt Cookbook

**Date:** 2026-05-13  
**Auditor:** Claude Code (automated heuristic pass)  
**Human cross-check required:** Elliot Jarbe (AD/HR directory access needed to confirm or clear AMBER entries)  
**Branch:** feat/cookbook-mvp  
**Commit at audit:** 3025a43  

---

## Summary

| Total personas | GREEN | AMBER | RED |
|---|---|---|---|
| 30 | 26 | 4 | 0 |

No positive match to a known real Manatee County employee was found. AMBER entries require human verification against the county AD/HR directory before Phase 2 rollout.

---

## Heuristic Rules Applied

- **GREEN**: Name is clearly fictional or generic; no titled prefix; role does not map to a uniquely identifiable position.
- **AMBER**: Any of — titled prefix (Director, Dr.); role is a named directorship publicly listed on the county org chart; or the name + role combination narrows the coincidence space enough that a real employee match is plausible.
- **RED**: Positive evidence (org chart, press release, county directory) that the name matches a real employee. None triggered.

---

## 30-Entry Inventory

| Ch | Persona | Role | Flag | Recommendation | Proposed replacement |
|---|---|---|---|---|---|
| 01 | Maria Chen | HR Coordinator, Manatee County Human Resources | GREEN | No action needed | — |
| 02 | James Torres | IT Analyst, Manatee County Information Technology | GREEN | No action needed | — |
| 03 | Lisa Morales | Communications Officer, Manatee County Public Affairs | GREEN | No action needed | — |
| 04 | David Park | Emergency Management Coordinator, Manatee County Public Safety | GREEN | No action needed | — |
| 05 | Rachel Kim | PIO, Manatee County Public Information Office | GREEN | No action needed | — |
| 06 | Carlos Rivera | Department Director, Manatee County Public Works | GREEN | Generic name, clearly invented | — |
| 07 | Angela Foster | HR Coordinator, Manatee County Human Resources | GREEN | No action needed | — |
| 08 | Rachel Kim | PIO, Manatee County Public Information Office | GREEN | Reuse of Ch05 persona, no new risk | — |
| 09 | David Park | Emergency Management Coordinator, Manatee County Public Safety | GREEN | Reuse of Ch04 persona, no new risk | — |
| 10 | Tom Bradley | Utilities Field Supervisor, Manatee County Utilities | GREEN | No action needed | — |
| 11 | Angela Foster | HR Coordinator, Manatee County Human Resources | GREEN | Reuse of Ch07 persona, no new risk | — |
| 12 | Maria Chen | HR Coordinator, Manatee County Human Resources | GREEN | Reuse of Ch01 persona, no new risk | — |
| 13 | James Torres | IT Analyst, Manatee County Information Technology | GREEN | Reuse of Ch02 persona, no new risk | — |
| 14 | Lisa Morales | Communications Officer, Manatee County Public Affairs | GREEN | Reuse of Ch03 persona, no new risk | — |
| 15 | Carlos Rivera | Department Director, Manatee County Public Works | GREEN | Reuse of Ch06 persona, no new risk | — |
| 16 | James Torres | IT Analyst, Manatee County Information Technology | GREEN | Reuse of Ch02 persona, no new risk | — |
| 17 | Tom Bradley | Utilities Field Supervisor, Manatee County Utilities | GREEN | Reuse of Ch10 persona, no new risk | — |
| 18 | James Torres | IT Analyst, Manatee County Information Technology | GREEN | Reuse of Ch02 persona, no new risk | — |
| 19 | Carlos Rivera | Department Director, Manatee County Public Works | GREEN | Reuse of Ch06 persona, no new risk | — |
| 20 | Angela Foster | HR Coordinator, Manatee County Human Resources | GREEN | Reuse of Ch07 persona, no new risk | — |
| 21 | Director James Wilson | Department Director, Manatee County Public Works | **AMBER** | Titled prefix "Director" prepended to name; named directorship is publicly listed on county org chart. Verify against AD/HR before Phase 2. If cleared, remove prefix from display name. | "James Wilson" (drop prefix) or "Marcus Webb, Department Director, Public Works" |
| 22 | Sarah Martinez | Training Coordinator, Manatee County HR | GREEN | No action needed | — |
| 23 | Alex Rivera | Budget Analyst, Manatee County Finance | GREEN | No action needed | — |
| 24 | Maria Chen | HR Coordinator, Manatee County Human Resources | GREEN | Reuse of Ch01 persona, no new risk | — |
| 25 | Tom Rodriguez | Communications Director, Manatee County | **AMBER** | "Communications Director" without dept qualifier maps to a uniquely identifiable county leadership position. Verify. If cleared, add department qualifier to reduce specificity. | "Tom Rodriguez, Communications Specialist, Manatee County Public Affairs" |
| 26 | Lisa Park | IT Training Specialist, Manatee County IT | GREEN | No action needed | — |
| 27 | David Kim | Communications Specialist, Manatee County | GREEN | No action needed | — |
| 28 | Rachel Torres | Graphic Designer, Manatee County Communications | GREEN | No action needed | — |
| 29 | Dr. Karen Liu | Quality Assurance Lead, Manatee County IT | **AMBER** | Dr. prefix + specific role narrows coincidence space. Verify against AD/HR. If no match, remove Dr. prefix as it carries no instructional value for this chapter. | "Karen Liu, Quality Assurance Lead, Manatee County IT" |
| 30 | Dr. Karen Liu | Quality Assurance Lead, Manatee County IT | **AMBER** | Same as Ch29 — duplicate persona, same risk. | "Karen Liu, Quality Assurance Lead, Manatee County IT" |

---

## Recommended Actions Before Phase 2 Rollout

1. **Elliot cross-checks the 4 AMBER entries** against county AD/HR: Director James Wilson (Ch21), Tom Rodriguez (Ch25), Dr. Karen Liu (Ch29, Ch30).
2. If any AMBER entry matches a real employee: rename in `cookbookData.ts` using the proposed replacement column above.
3. If all AMBER entries clear: optionally remove the titled prefix from Ch21 and Dr. prefix from Ch29/Ch30 as a precaution (no instructional value lost).
4. The fictional disclaimer added in this task (Resources.tsx + cookbookData.ts header) covers all 30 entries pending that human review.

---

## Out of Scope

- `docs/mvp-pre-deletion-audit.md` — reviewed; no persona names appear.
- `client/src/pages/Resources.tsx` email placeholder `placeholder="Jane Smith"` — not a persona; intentional form hint, no action.
- `TRAINING_RECIPIENT` constant — real address by design, not a cookbook persona.
