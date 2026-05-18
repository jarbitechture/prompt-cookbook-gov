/** Builder-bundle-local design tokens — "Precision Instrument" palette.
 *  DO NOT import from @/lib/theme here or anywhere in the builder bundle. */

export const bg         = "#F7F8FA";
export const surface    = "#FFFFFF";
export const ink        = "#1B2230";
export const inkMuted   = "oklch(0.45 0.02 250)";
export const accent     = "oklch(0.48 0.12 220)";
export const accentSoft = "oklch(0.94 0.03 220)";
export const hairlineColor = "oklch(0.90 0.01 250)";
export const hairline   = `1px solid ${hairlineColor}`;
/** Text/icons rendered ON accent-colored backgrounds (headers, filled buttons).
 *  Near-white with a neutral cool hue — no warm hue 75 bleed. */
export const onAccent   = "oklch(0.98 0.005 250)";

export const builderTheme = { bg, surface, ink, inkMuted, accent, accentSoft, hairlineColor, hairline, onAccent } as const;
export type BuilderTheme = typeof builderTheme;

/**
 * Inject an alpha channel into a bare `oklch(L C H)` token.
 * Assumes the token has no existing alpha component — true for all current
 * builder-theme tokens.  Returns `oklch(L C H / a)`.
 */
export function withAlpha(oklchToken: string, a: number): string {
  return oklchToken.replace(/\)$/, ` / ${a})`);
}
