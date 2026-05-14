/**
 * welcomeStorage.ts — U5 (2026-05-14)
 *
 * Thin localStorage wrapper for the Builder welcome-banner "seen" state.
 * Exported as pure functions so tests can inject a mock storage without jsdom.
 */

export const WELCOME_KEY = "builder-welcome-seen";

/**
 * Returns true only if the user has previously dismissed the welcome banner.
 * Catches SecurityError when localStorage is unavailable (private browsing,
 * embedded iframes) and returns false (show banner = safe default).
 */
export function getWelcomeSeen(): boolean {
  try {
    return localStorage.getItem(WELCOME_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Persists the welcome-banner dismissed state.
 * Passing false removes the key (resets to "not seen") rather than storing
 * "false", so absence always means unseen.
 */
export function setWelcomeSeen(seen: boolean): void {
  try {
    if (seen) {
      localStorage.setItem(WELCOME_KEY, "true");
    } else {
      localStorage.removeItem(WELCOME_KEY);
    }
  } catch {
    // localStorage unavailable — silently ignore
  }
}
