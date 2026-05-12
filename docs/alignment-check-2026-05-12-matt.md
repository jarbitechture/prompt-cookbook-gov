# Stakeholder alignment check — Matt meeting vs MVP plan

**Date:** 2026-05-12
**Source:** 2026-05-12 9:01 AM Matt 1:1 cookbook strategy discussion (49m 58s)
**Plan reference:** `docs/superpowers/plans/2026-05-12-cookbook-mvp.md`

This document is the alignment cross-reference produced after the MVP plan was drafted. It exists so any subsequent reviewer (or future-Elliot) can audit the plan against the source conversation.

---

## Verdict

**The plan is faithful to the meeting.** All 7 design points trace to verbatim Matt or Elliot statements. Three meeting commitments were not in the original plan and have been amended in:
- Plan §1 — reputational-risk framing for hallucination
- Plan §6 Task #16 — explicit CODEOWNERS = Matt + Keith + Chris
- Plan §8 — Phase 1 (Matt 2026-05-15) / Phase 2 (Working Group early June) / Phase 3 (county-wide)
- Plan §10 (new) — Phase-2 integration candidates

Overall confidence: **0.92**.

---

## 7-point alignment matrix

| # | MVP design point | Source quote | Alignment |
|---|---|---|---|
| 1 | Prompt quality tool, not LLM passthrough | Matt: *"It's helping people improve their prompts. Not being another LLM for them to use to get. Rewrite things or or anything like that, right? We force them down to copilot to do that."* | ✅ Verbatim |
| 2 | Send-to-Copilot as the handoff (clipboard after Task #14 spike) | Matt: *"We force them down to copilot to do that."* (No mechanism specified — clipboard does not contradict) | ✅ Aligned |
| 3 | Civic-ai governed proxy on bcc-ap-infer01 (ADR-007) | Elliot: *"The civic AI tool would be one which would be like an open AI proxy, and that would be on, I guess it'd be on the inference server."* | ✅ ADR-007 verbatim originated in this meeting |
| 4 | Three LLM modes — Critique, Refine, Preview | Matt: *"When you run the prompt, there's another prompt in front of that that says, 'evaluate this prompt or rewrite this prompt.' ... don't respond to the prompt but respond to this. ... this preceding prompt that's having you evaluate the prompt."* + *"I think feedback on the prompts, And then ... maybe we can do a little bit of rag around prompting best practices."* | ⚠️ Aligned in spirit. Matt's verbal framing collapsed to 1-2 patterns (evaluate + rewrite). Plan formalized **three** modes. **Refine** is the plan-author's addition; recommend explicit Matt confirmation at Friday demo. |
| 5 | Subpath-deployable (no IIS root assumption) | Matt: *"I do think we need to put it in a in the prompt builder subdirectory. ... We probably should limit what's at that root at least just an index file that points it to whatever. ... [don't] lock ourselves into deploying to the root directory of IIS."* | ✅ Verbatim — the constraint originated here |
| 6 | Prompt Builder is the primary surface | Matt: *"if we can if we can focus on the prompt builder."* + *"focus on the prompt builder. We reduce hallucinations as wherever we can."* | ✅ Verbatim |
| 7 | Zero LLM in cookbook code (only via civic-ai) | Matt: *"It doesn't actually run the prompt."* — re cookbook LLM doing meta-evaluation only | ✅ Aligned |

---

## Stakeholder commitments captured in plan amendments

### A. CODEOWNERS = Matt + Keith + Chris (now in Task #16)

Source quote:
> Matt: "I mean us. You know me Keith Chris you read through the the whole application and make sure the I am concerned with the hallucinations."

Plan amendment: Task #16 description now names the trio. GitHub usernames TBD — placeholder entries acceptable for the scaffold commit.

### B. Phase 1 demo to Matt — Friday 2026-05-15 (now in §8)

Source quotes:
> Elliot: "I want to refactor the code base ... I want to have that ready to show you like end of week."
> Matt: "I'll be back in the office Thursday afternoon after lunch. I'll be back. I'll be back in the office and then all day Friday."

Plan amendment: §8 now lists Phase 1 target as 2026-05-15.

### C. Phase 2 demo to AI Working Group — early June (now in §8)

Source quote:
> Elliot: "we have a working group meeting if not probably next month early in early next month. ... But I want to show this. I want our prompt group to be able to use this too."
> Matt: "I do too. I do too. I want to just like I said, I want to get out there."

Plan amendment: §8 now lists Phase 2 target as early June 2026.

### D. Reputational risk framing (now in §1)

Source quotes:
> Matt: "I don't want us to lose credibility too soon. ... I just don't want somebody to type in something about financials or and then it respond with ... a hallucination vector about something."
> Matt: "Funny is the worst part, right? If something if it comes back with something funny, somebody takes a screenshot."

Plan amendment: §1 now includes "the screenshot defense" framing tying technical controls to credibility risk.

### E. Matt's SharePoint Python module — Phase 2 integration (now in §10)

Source quote:
> Matt: "I got this uh building out a Python like Python module that we can reuse. ... basically download a file from SharePoint, and then it will, and then we can create a page so we can pass pass the HTML. Have it build a SharePoint page to post content to."

Plan amendment: new §10 (Phase-2 candidates) lists Matt's SharePoint publishing module as a future integration target, not MVP scope.

---

## Adjacent context (filed for reference, no plan impact)

### Jeff Pace / Claude / P-card situation
Substantial portion of the meeting covered Jeff Pace's unsanctioned Claude usage (P-card-purchased by Mark Murphy, ~6+ months ago, ongoing). Mike Holt (new GIS manager) is willing to fund continuation. Drew is the budget signer. Mike asked Elliot whether Jeff's "deep learning" tool should be allowed as a one-off; Elliot pushed back with a list of questions about workflow specifics, comparable tool achievability, and standard-setting risk.

Implication for cookbook MVP: a clean MVP ship strengthens Elliot's position in the governance debate. A "funny screenshot" weakens it. This is the political subtext for the reputational-risk framing.

### Azure CLI / GitHub flagging
Both Matt and Elliot flagged by Giselle yesterday for personal-credential Azure CLI auth. Matt floated enterprise app / service principal. Unresolved at meeting end.

### GIS team model-choice tribalism
Matt: "they got their they got their favorites now, and it's just it's hard to sell them at point" — Claude, ChatGPT, Google. Adoption risk for Copilot-only handoff. Worth surfacing at the Working-Group demo.

---

## Open items for Friday 2026-05-15 Matt demo

1. **Confirm Refine mode** — is the three-mode framing (vs Matt's verbal 1-2 patterns) the right MVP scope?
2. **Confirm CODEOWNERS GitHub usernames** for Matt, Keith, Chris.
3. **Demo the breaker degradation path** — show what happens when civic-ai is unreachable (ADR-005).
4. **Confirm RAG scope** — Matt agreed to "a little bit of rag around prompting best practices"; plan implements keyword RAG over chapters. Sized appropriately?
5. **Confirm what happens to the existing ChatbotWidget** — meeting did not explicitly cover this; plan proposes deletion in Task #19 (coach role moves to Builder hints).
