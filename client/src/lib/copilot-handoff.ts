/**
 * copilot-handoff.ts — Task #11 + Task β + P0-A patch (2026-05-14)
 *
 * Clipboard-only handoff to M365 Copilot (deep-link unsupported per spike).
 * Swap-point: buildCopilotUrl() returns the canonical URL — change it once here.
 * ChatGPT Enterprise: buildChatGptUrl() — TODO swap to county SSO URL when provisioned.
 *
 * sendToTarget ordering (popup-blocker rule + PII pre-flight):
 *   0. scanForPii(prompt) — SYNCHRONOUS. Throws PiiDetectedError if flagged.
 *      Throwing before window.open means no orphan tab is left behind.
 *   1. window.open() — MUST be synchronous, before any await (popup-blocker)
 *   2. await navigator.clipboard.writeText() — requires user-gesture context
 *   3. void fetch() — fire-and-forget ROI telemetry, never blocks
 *
 * The follow-up "Send anyway" / "Redact and send" call from the modal
 * fires from a fresh user-gesture click handler — the popup-blocker
 * contract still holds.
 */

import { scanForPii, type ScanMatch } from "./pre-send-scan";

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

// ─── PII pre-flight error ────────────────────────────────────────────────────

/**
 * Thrown by sendToTarget when the pre-send scan detects PII patterns
 * and the caller did not pass `{ skipPiiScan: true }`. Carries the
 * scan results so the caller can render a "redact / send anyway"
 * modal without re-running the scan.
 */
export class PiiDetectedError extends Error {
  constructor(
    public readonly matches: ScanMatch[],
    public readonly redacted: string,
    public readonly target: "copilot" | "chatgpt_enterprise",
    public readonly mode?: "critique" | "refine" | "preview" | "manual",
  ) {
    super("PII detected in prompt before clipboard handoff");
    this.name = "PiiDetectedError";
    // Restore prototype chain for `instanceof` to work across the
    // transpiled output — required for ES5/ES2015 targets.
    Object.setPrototypeOf(this, PiiDetectedError.prototype);
  }
}

// ─── Telemetry helpers ───────────────────────────────────────────────────────

/**
 * Fire-and-forget POST to /api/roi/pii-flagged. NEVER blocks the
 * caller. Sends pattern types + count only — no raw matches.
 */
function emitPiiFlagged(
  matches: ScanMatch[],
  action: "blocked" | "send_anyway" | "redact_and_send",
  targetTool: "copilot" | "chatgpt_enterprise",
): void {
  const patternTypes = Array.from(new Set(matches.map((m) => m.pattern)));
  void fetch("/api/roi/pii-flagged", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      pattern_types: patternTypes,
      match_count: matches.length,
      action,
      target_tool: targetTool,
    }),
  }).catch(() => {
    // Telemetry failure is silent — never blocks handoff.
  });
}

// ─── Options ─────────────────────────────────────────────────────────────────

export interface SendToTargetOptions {
  /**
   * Skip the PII pre-flight scan. Used by the "Send anyway" branch of
   * the warning modal, where the user has already been shown the
   * detection and chosen to proceed. Default: false.
   */
  skipPiiScan?: boolean;
}

// ─── Main handoff ────────────────────────────────────────────────────────────

/**
 * Open the target AI tool in a new tab, copy `prompt` to the clipboard, and
 * emit a fire-and-forget TEMPLATE_EXPORT telemetry event to the server.
 *
 * Popup-blocker contract: window.open() is synchronous — called before any
 * await, and AFTER the synchronous PII scan throws/returns.
 *
 * @throws {PiiDetectedError} when scanForPii flags the prompt and
 *   options.skipPiiScan is not true. The PII_FLAGGED telemetry event
 *   is emitted with action="blocked" before the throw; no clipboard
 *   write, no window.open.
 *
 * @param prompt    — assembled prompt text
 * @param target    — which tool to open ("copilot" | "chatgpt_enterprise")
 * @param mode      — originating coach mode, or undefined when from BuildMode
 * @param options   — optional flags; see SendToTargetOptions
 */
export async function sendToTarget(
  prompt: string,
  target: "copilot" | "chatgpt_enterprise",
  mode?: "critique" | "refine" | "preview" | "manual",
  options?: SendToTargetOptions,
): Promise<void> {
  // 0. Pre-flight PII scan — synchronous. Throws before any side effects.
  if (!options?.skipPiiScan) {
    const scan = scanForPii(prompt);
    if (scan.flagged) {
      // Telemetry: record the block. No raw matches transmitted.
      emitPiiFlagged(scan.matches, "blocked", target);
      throw new PiiDetectedError(scan.matches, scan.redacted, target, mode);
    }
  } else {
    // The user explicitly chose "Send anyway" from the modal — emit
    // an event so the dashboard sees both branches of the decision.
    // We still scan to count matches; we just don't block.
    const scan = scanForPii(prompt);
    if (scan.flagged) {
      emitPiiFlagged(scan.matches, "send_anyway", target);
    }
  }

  // 1. Open synchronously — BEFORE any await to avoid popup-blockers.
  const url = target === "chatgpt_enterprise" ? buildChatGptUrl() : buildCopilotUrl();
  window.open(url, "_blank");

  // 2. Copy prompt to clipboard.
  await navigator.clipboard.writeText(prompt);

  // 3. Fire-and-forget TEMPLATE_EXPORT telemetry — must NOT throw to caller.
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
 * "Redact and send" branch of the PII warning modal — assumes the
 * caller has already inspected the redacted version and confirmed.
 * Re-uses sendToTarget with the redacted prompt and skipPiiScan, then
 * emits a redact_and_send telemetry event for the dashboard.
 */
export async function sendRedactedToTarget(
  redactedPrompt: string,
  originalMatches: ScanMatch[],
  target: "copilot" | "chatgpt_enterprise",
  mode?: "critique" | "refine" | "preview" | "manual",
): Promise<void> {
  emitPiiFlagged(originalMatches, "redact_and_send", target);
  return sendToTarget(redactedPrompt, target, mode, { skipPiiScan: true });
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
