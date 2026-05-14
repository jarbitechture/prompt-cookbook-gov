/**
 * copilot-handoff.ts — Task #11 + Task β
 *
 * Clipboard-only handoff to M365 Copilot (deep-link unsupported per spike).
 * Swap-point: buildCopilotUrl() returns the canonical URL — change it once here.
 * ChatGPT Enterprise: buildChatGptUrl() — TODO swap to county SSO URL when provisioned.
 *
 * sendToTarget ordering (popup-blocker rule):
 *   1. window.open() — MUST be synchronous, before any await
 *   2. await navigator.clipboard.writeText() — requires user-gesture context
 *   3. void fetch() — fire-and-forget ROI telemetry, never blocks
 */

/** Swap-point: the canonical URL to open when sending to Copilot. */
export function buildCopilotUrl(): string {
  return "https://m365.cloud.microsoft/chat";
}

/**
 * Swap-point: URL to open for ChatGPT Enterprise.
 * TODO: replace with county SSO deep-link when M365 ChatGPT Enterprise SSO is provisioned.
 */
export function buildChatGptUrl(): string {
  return "https://chatgpt.com/";
}

/**
 * Open the target AI tool in a new tab, copy `prompt` to the clipboard, and
 * emit a fire-and-forget TEMPLATE_EXPORT telemetry event to the server.
 *
 * Popup-blocker contract: window.open() is synchronous — called before any await.
 *
 * @param prompt    — assembled prompt text
 * @param target    — which tool to open ("copilot" | "chatgpt_enterprise")
 * @param mode      — originating coach mode, or undefined when from BuildMode
 */
export async function sendToTarget(
  prompt: string,
  target: "copilot" | "chatgpt_enterprise",
  mode?: "critique" | "refine" | "preview" | "manual",
): Promise<void> {
  // 1. Open synchronously — BEFORE any await to avoid popup-blockers.
  const url = target === "chatgpt_enterprise" ? buildChatGptUrl() : buildCopilotUrl();
  window.open(url, "_blank");

  // 2. Copy prompt to clipboard.
  await navigator.clipboard.writeText(prompt);

  // 3. Fire-and-forget telemetry — must NOT throw to caller.
  void fetch("/api/roi/template-export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      target_tool: target,
      ...(mode !== undefined ? { mode } : {}),
    }),
  }).catch(() => {
    // Telemetry failure is silent — never blocks the handoff.
  });
}

/**
 * Open Copilot in a new tab, copy `prompt` to the clipboard, and emit a
 * fire-and-forget TEMPLATE_EXPORT telemetry event to the server.
 *
 * @param prompt    — assembled prompt text
 * @param mode      — originating coach mode, or undefined when from BuildMode
 * @deprecated Use sendToTarget(prompt, "copilot", mode) instead.
 */
export async function sendToCopilot(
  prompt: string,
  mode?: "critique" | "refine" | "preview" | "manual",
): Promise<void> {
  return sendToTarget(prompt, "copilot", mode);
}
