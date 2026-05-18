import { describe, it, expect } from "vitest";
import {
  accent,
  accentSoft,
  bg,
  surface,
  ink,
  inkMuted,
  hairline,
  builderTheme,
  withAlpha,
} from "./builder-theme";

describe("builder-theme tokens", () => {
  it("exports the exact accent value", () => {
    expect(accent).toBe("oklch(0.48 0.12 220)");
  });

  it("exports the exact accentSoft value", () => {
    expect(accentSoft).toBe("oklch(0.94 0.03 220)");
  });

  it("exports all seven tokens via builderTheme object", () => {
    expect(builderTheme.bg).toBe("#F7F8FA");
    expect(builderTheme.surface).toBe("#FFFFFF");
    expect(builderTheme.ink).toBe("#1B2230");
    expect(builderTheme.inkMuted).toBe("oklch(0.45 0.02 250)");
    expect(builderTheme.hairline).toBe("1px solid oklch(0.90 0.01 250)");
  });

  it("individual exports match builderTheme object", () => {
    expect(bg).toBe(builderTheme.bg);
    expect(surface).toBe(builderTheme.surface);
    expect(ink).toBe(builderTheme.ink);
    expect(inkMuted).toBe(builderTheme.inkMuted);
    expect(accent).toBe(builderTheme.accent);
    expect(accentSoft).toBe(builderTheme.accentSoft);
    expect(hairline).toBe(builderTheme.hairline);
  });
});

describe("withAlpha", () => {
  it("injects alpha into accent token", () => {
    expect(withAlpha(accent, 0.4)).toBe("oklch(0.48 0.12 220 / 0.4)");
  });

  it("injects alpha = 0 (transparent end of pulse)", () => {
    expect(withAlpha(accent, 0)).toBe("oklch(0.48 0.12 220 / 0)");
  });

  it("works on inkMuted token", () => {
    expect(withAlpha(inkMuted, 0.6)).toBe("oklch(0.45 0.02 250 / 0.6)");
  });
});
