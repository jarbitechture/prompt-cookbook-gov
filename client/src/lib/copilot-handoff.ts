/**
 * copilot-handoff.ts — Task #11
 *
 * Clipboard-only handoff to M365 Copilot (deep-link unsupported per spike).
 * Swap-point: buildCopilotUrl() returns the canonical URL — change it once here.
 *
 * sendToCopilot ordering (popup-blocker rule):
 *   1. window.open() — MUST be synchronous, before any await
 *   2. await navigator.clipboard.writeText() — requires user-gesture context
 *   3. void fetch() — fire-and-forget ROI telemetry, never blocks
 */

/** Swap-point: the canonical URL to open when sending to Copilot. */
export function buildCopilotUrl(): string {
  return "https://m365.cloud.microsoft/chat";
}

/**
 * Open Copilot in a new tab, copy `prompt` to the clipboard, and emit a
 * fire-and-forget TEMPLATE_EXPORT telemetry event to the server.
 *
 * @param prompt    — assembled prompt text
 * @param mode      — originating coach mode, or undefined when from BuildMode
 */
export async function sendToCopilot(
  prompt: string,
  mode?: "critique" | "refine" | "preview" | "manual",
): Promise<void> {
  // 1. Open synchronously — BEFORE any await to avoid popup-blockers.
  window.open(buildCopilotUrl(), "_blank");

  // 2. Copy prompt to clipboard.
  await navigator.clipboard.writeText(prompt);

  // 3. Fire-and-forget telemetry — must NOT throw to caller.
  void fetch("/api/roi/template-export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      target_tool: "copilot",
      ...(mode !== undefined ? { mode } : {}),
    }),
  }).catch(() => {
    // Telemetry failure is silent — never blocks the handoff.
  });
}
