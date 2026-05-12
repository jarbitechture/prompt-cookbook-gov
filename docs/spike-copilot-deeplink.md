# Spike: Copilot Deep-Link Pre-Filled Prompt

**Task:** Task #14 — research spike. Determine whether the cookbook's "Send to Copilot" button can open Microsoft 365 Copilot Business Chat (`https://m365.cloud.microsoft/chat`) with the user's constructed prompt pre-filled via URL, in addition to the always-on clipboard copy.

**Date:** 2026-05-12
**Author:** Research spike (1 hour)

---

## 1. Verdict

**UNSUPPORTED on the enterprise target surface (`m365.cloud.microsoft/chat`).** No documented or evidence-backed mechanism exists for pre-filling a prompt in Microsoft 365 Copilot Business Chat via URL parameter, fragment, or custom URI scheme.

A `?q=` parameter on the **consumer** surface (`copilot.microsoft.com`) historically auto-populated the chat input, but: (a) it has never been officially documented, (b) it broke in late 2025 — it now displays the value as a heading and leaves the input box empty, and (c) Microsoft server-side-patched a related parameter-to-prompt-injection vector ("Reprompt") on 2026-01-13/14, which is a hard disqualifier for a county government deployment regardless of any residual functionality.

Recommendation: ship clipboard-only. Treat any "pre-fill" feature as out of scope until Microsoft publishes a documented, enterprise-supported, audit-friendly mechanism.

---

## 2. Evidence

### 2.1 Enterprise surface `m365.cloud.microsoft/chat` — no documented prefill

Searched Microsoft Learn, Microsoft Q&A, Microsoft Tech Community, and the official `microsoft-365-docs` GitHub repository (`copilot/copilot-prompt-gallery.md`, pulled live via `gh api`). Findings:

- The official Manage / Overview docs describe `m365.cloud.microsoft/chat` only as the landing URL after Entra sign-in. No query-string parameter is documented. (`learn.microsoft.com/en-us/copilot/manage`, `learn.microsoft.com/en-us/copilot/overview`.)
- The Prompt Gallery doc (`copilot/copilot-prompt-gallery.md`, `ms.date: 2026-02-06`, fetched via GitHub raw) describes Microsoft-curated prompts users can "try in Copilot" but documents no shareable URL format. The catalog is served from the Substrate Data Store and is gated behind authenticated access; unauthenticated visitors at `m365.cloud.microsoft/copilot-prompts` can view prompts but must sign in to try them.
- The Microsoft Support article "Share your best prompts with others" describes a **"Copy prompt link"** feature: run a prompt, hover over it, click Copy prompt link, paste into Teams/OneNote. The article does not publish the URL format, and the support page is gated against scrapers (WebFetch denied). On the related Microsoft Q&A thread "Copilot 'Share prompt and copy with response' option doesn't include actual link for other users?" the only substantive answer (Ben Hoffmann) says: *"Most of the data in a Copilot deep link that contains the prompt is base64-encoded. But the actual prompt seems to be an ID referencing some resource which I can't get to."* This strongly implies the share link is an **opaque reference to a tenant-scoped Substrate resource**, not a free-form prompt encoded in the URL. It cannot be constructed client-side from arbitrary text.
- No `ms-copilot:`, `officeapp:`, or `msteams:`-based URI scheme for opening Copilot Chat with a pre-filled prompt is documented. The only documented Copilot-adjacent deep link is the Teams **Copilot handoff** (`https://teams.microsoft.com/l/chat/0/0?users=28:${botId}&continuation=${continuationToken}`), which carries a server-issued continuation token, not a free-form prompt, and targets a bot in Teams — not the Copilot chat surface. Source: `learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/bot-copilot-handoff` (`updated_at: 2026-04-01`).

### 2.2 Consumer surface `copilot.microsoft.com` — `?q=` exists, undocumented, broken

- The pattern `https://copilot.microsoft.com/?q=<text>` was used in the wild as a custom-search-engine target (Firefox/Floorp). Microsoft Q&A "Copilot Web App: ?q= parameter no longer populates chat input (regression)" (active thread, with frustration posts dated Feb-Mar 2026): the parameter **previously** auto-populated the chat input box; as of late 2025 it now renders the query as a heading at the top of the page and leaves the input box empty, requiring an extra click. No Microsoft Learn page documents this parameter; no official Microsoft response on the thread.
- Varonis Threat Labs "Reprompt" research (disclosed to Microsoft 2025-08-31; server-side-patched 2026-01-13/14; iTnews, Wizard Cyber, Varonis blog, paperclipped.de reporting): confirms `copilot.microsoft.com/?q=[instructions]` was a working URL-to-prompt vector ("Parameter 2 Prompt" / P2P injection). The patch was service-side, no CVE issued. The Q&A regression thread suggests the post-patch behavior is exactly the "displays heading but does not submit" state.
- The consumer surface (`copilot.microsoft.com`) does not accept Entra work-or-school accounts. Per Microsoft: *"The Microsoft Copilot app, which is a consumer experience, doesn't support Microsoft Entra authentication and users trying to sign in to the app using a Microsoft Entra account will be redirected to https://m365.cloud.microsoft/chat in their default browser."* The redirect is an auth handoff, **not** a URL-parameter passthrough. Tests of `?q=` on the consumer surface tell us nothing about whether the enterprise surface honors it. No evidence was found that `?q=` ever worked on `m365.cloud.microsoft/chat`.

### 2.3 Adaptive Cards / Loop / Copilot Pages

No documented Adaptive Card action or Loop component opens Copilot Chat with a pre-filled prompt. The only Copilot-related Adaptive Card action found is `Action.OpenUrl` pointing at a Teams bot deep link with a `continuation` token (see 2.1).

### 2.4 Sources

- [Copilot Web App: ?q= parameter no longer populates chat input (regression) — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5612477/copilot-web-app-q-parameter-no-longer-populates-ch)
- [Copilot "Share prompt and copy with response" option doesn't include actual link for other users? — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/5621655/copilot-share-prompt-and-copy-with-response-option)
- [How can I invoke copilot.microsoft.com programmatically via an API… — Microsoft Q&A](https://learn.microsoft.com/en-sg/answers/questions/1625088/how-can-i-invoke-copilot-microsoft-com-programmati)
- [Reprompt: The Single-Click Microsoft Copilot Attack — Varonis](https://www.varonis.com/blog/reprompt)
- [Microsoft patches single-click Copilot data stealing attack — iTnews](https://www.itnews.com.au/news/microsoft-patches-single-click-copilot-data-stealing-attack-622977)
- [Manage Microsoft 365 Copilot Chat — Microsoft Learn](https://learn.microsoft.com/en-us/copilot/manage)
- [Overview of Microsoft 365 Copilot Chat — Microsoft Learn](https://learn.microsoft.com/en-us/copilot/overview)
- [Understand Prompt Gallery in Copilot — MicrosoftDocs/microsoft-365-docs (raw, ms.date 2026-02-06)](https://github.com/MicrosoftDocs/microsoft-365-docs/blob/public/copilot/copilot-prompt-gallery.md)
- [Microsoft 365 Copilot Prompts Gallery (live)](https://m365.cloud.microsoft/copilot-prompts)
- [Share your best prompts with others — Microsoft Support](https://support.microsoft.com/en-us/topic/share-your-best-prompts-75402b14-b419-494d-9e58-1709b4f334a2)
- [Copilot Handoffs for Bots — Microsoft Learn (updated 2026-04-01)](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/bot-copilot-handoff)

---

## 3. Recommended implementation: clipboard-only

The "Send to Copilot" button does two things, in order:

1. **Copy to clipboard** via `navigator.clipboard.writeText(prompt)` (Clipboard API, available in all evergreen browsers used by county staff). Show a transient "Copied" confirmation in the UI.
2. **Open Copilot Chat in a new tab** at the bare URL `https://m365.cloud.microsoft/chat` with `target="_blank"` and `rel="noopener noreferrer"`. The user pastes (Ctrl+V / Cmd+V) into the chat input.

### Reference snippet (framework-agnostic)

```js
const COPILOT_URL = "https://m365.cloud.microsoft/chat";

async function sendToCopilot(promptText) {
  try {
    await navigator.clipboard.writeText(promptText);
  } catch (err) {
    // Clipboard write can fail under restricted permissions; surface the
    // prompt in a copy-fallback modal so the user can manually select+copy.
    showCopyFallbackModal(promptText);
    return;
  }
  window.open(COPILOT_URL, "_blank", "noopener,noreferrer");
  showToast("Prompt copied. Paste it into Copilot (Ctrl+V).");
}
```

### Why this is the right call (not just the only call)

- **Auditable.** The clipboard write is a single, well-understood browser API call. No request leaves the user's machine. The Copilot URL is a constant. Both behaviors are trivially explainable to county Information Security.
- **No data-loss risk from URL length limits.** Browser/SharePoint URL limits hover around 2,083–4,000 characters depending on path. Cookbook prompts can easily exceed that.
- **No PII in URL history / referer / logs.** A clipboard payload doesn't end up in browser history, proxy logs, ITS network captures, or SharePoint audit feeds — which is the failure mode any URL-based prefill would create. Operating Rule #10 (government constraints: PII handling, audit trails, public records compliance) makes this load-bearing.
- **No coupling to undocumented Microsoft behavior.** When Microsoft changes a documented contract they announce it; when they change an undocumented one (as they did with `?q=` in late 2025) downstream consumers silently break.

### Progressive-enhancement hook to leave in the code

Wrap the open-tab call in a `buildCopilotUrl(promptText)` helper that today just returns `COPILOT_URL`. If Microsoft publishes a documented URL contract later, we change one function. No call-site changes needed.

```js
function buildCopilotUrl(_promptText) {
  // 2026-05: No documented URL-prefill mechanism for m365.cloud.microsoft/chat.
  // Clipboard fallback only. If MS ships a documented contract, update here.
  return COPILOT_URL;
}
```

---

## 4. Open risks

| Risk | Severity | Mitigation |
|---|---|---|
| **Reprompt-class prompt-injection** (parameter-to-prompt URL vectors are an active attack surface; MS patched 2026-01-13/14) | High — would be the headline objection from county Information Security if we shipped a `?q=`-style link | Don't ship URL-based prefill at all. Clipboard-only sidesteps this entirely. |
| User on a managed device where browser clipboard permission is denied | Medium | The `try/catch` falls back to a "select all + copy" modal showing the prompt in a textarea. |
| User signed into a personal MSA in their default browser (lands on `copilot.microsoft.com`, not `m365.cloud.microsoft/chat`) | Low–Medium for the county tenant (most county staff are signed into Entra in Edge), but real for personal devices | The target URL `https://m365.cloud.microsoft/chat` will redirect to Entra sign-in for MSA-only users. Acceptable — surface a one-line note in the cookbook UI: "Send to Copilot opens Microsoft 365 Copilot Chat (work account)." |
| Microsoft consolidating Copilot domains (`*.cloud.microsoft` rollup is in progress) | Low | The constant lives in one helper. If `m365.cloud.microsoft/chat` is retired, change `COPILOT_URL` once. |
| Future: Microsoft documents a real deep-link contract for the enterprise surface | Opportunity, not risk | `buildCopilotUrl()` is the swap point. Re-run this spike if `learn.microsoft.com` adds a "Copilot URL parameters" page or the prompt-gallery share-link format gets published. |
| Browser pop-up blocker on `window.open` | Low | `window.open` from a direct user click (button onclick) is allowed by default. Document this constraint — do not call `sendToCopilot` from a setTimeout or async-after-await path that loses the user-gesture flag. |

---

## 5. Re-test triggers (when to re-run this spike)

- Microsoft publishes a Learn page documenting URL parameters for `m365.cloud.microsoft/chat`.
- The Prompt Gallery's "Copy prompt link" format gets published or reverse-engineered with a documented structure that supports arbitrary user-supplied text (not just curated Substrate resource IDs).
- Microsoft 365 Roadmap shows a "Share Copilot prompt via deep link" item shipping to GA.
- An MVP or Microsoft engineer blogs a confirmed enterprise prefill pattern with an example URL.

Until then: clipboard-only.
