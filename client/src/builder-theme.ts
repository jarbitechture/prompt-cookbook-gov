/** Builder-bundle-local design tokens — "Precision Instrument" palette.
 *  DO NOT import from @/lib/theme here or anywhere in the builder bundle. */

export const bg         = "#F7F8FA";
export const surface    = "#FFFFFF";
export const ink        = "#1B2230";
export const inkMuted   = "oklch(0.45 0.02 250)";
export const accent     = "oklch(0.48 0.12 220)";
export const accentSoft = "oklch(0.94 0.03 220)";
export const hairline   = "1px solid oklch(0.90 0.01 250)";

export const builderTheme = { bg, surface, ink, inkMuted, accent, accentSoft, hairline } as const;
export type BuilderTheme = typeof builderTheme;
