// ═══════════════════════════════════════════════════════════════════════════
// Shared design tokens — single source of truth for the oklch color system
// ═══════════════════════════════════════════════════════════════════════════

// Page backgrounds
export const PAGE_BG = "oklch(0.97 0.008 75)";
export const CARD_BG = "oklch(0.998 0.002 70)";
export const CARD_BORDER = "oklch(0.92 0.01 70)";
export const SIDEBAR_BG = "oklch(0.18 0.02 40)";
export const DARK_BG = "oklch(0.16 0.02 240)"; // preview panes, code blocks

// Text
export const TEXT_PRIMARY = "oklch(0.20 0.025 38)";
export const TEXT_SECONDARY = "oklch(0.42 0.04 50)";
export const TEXT_MUTED = "oklch(0.55 0.04 50)";
export const TEXT_ON_DARK = "oklch(0.85 0.02 75)";
export const TEXT_ON_ACCENT = "oklch(0.98 0.01 75)";

// Section accents (recipe card borders, part themes)
export const SECTION_COLORS = {
  part1: { accent: "oklch(0.38 0.14 245)", label: "START HERE", bg: "oklch(0.95 0.04 245)" },
  part2: { accent: "oklch(0.52 0.14 55)", label: "EVERYDAY USE", bg: "oklch(0.96 0.04 55)" },
  part3: { accent: "oklch(0.42 0.14 155)", label: "GOING DEEPER", bg: "oklch(0.95 0.04 155)" },
  part4: { accent: "oklch(0.42 0.14 300)", label: "GOVERNANCE & HORIZON", bg: "oklch(0.96 0.03 300)" },
} as const;

// Page-level accents
export const ACCENT_GAME = "oklch(0.42 0.14 155)";
export const ACCENT_BUILDER = "oklch(0.48 0.12 220)";
export const ACCENT_RESOURCES = "oklch(0.42 0.14 300)";
export const ACCENT_COOKBOOK = "oklch(0.55 0.12 45)"; // home page, general

// RTCO block colors (Builder)
export const RTCO_COLORS = {
  role: "oklch(0.45 0.14 250)",
  task: "oklch(0.42 0.14 155)",
  context: "oklch(0.50 0.14 75)",
  output: "oklch(0.45 0.12 310)",
  constraints: "oklch(0.50 0.16 25)",
  examples: "oklch(0.45 0.12 180)",
  reasoning: "oklch(0.40 0.12 270)",
} as const;

// Technique badge colors (Game)
export const TECHNIQUE_COLORS: Record<string, string> = {
  "Zero-Shot": "oklch(0.50 0.12 60)",
  "Few-Shot": "oklch(0.45 0.14 145)",
  "Chain-of-Thought": "oklch(0.45 0.14 250)",
  "Persona/Role": "oklch(0.45 0.14 310)",
  "Negative Prompting": "oklch(0.50 0.14 25)",
  "RTCO Framework": "oklch(0.45 0.14 200)",
  "Persona + Specificity": "oklch(0.45 0.14 310)",
  "Specificity + Constraints": "oklch(0.50 0.12 60)",
  "Format + Structure": "oklch(0.45 0.14 200)",
  "Persona + Negative Constraints": "oklch(0.50 0.14 25)",
};

// Callout colors (ChapterDetail)
export const CALLOUT = {
  tip: { bg: "oklch(0.97 0.03 75)", border: "oklch(0.65 0.18 75)", label: "oklch(0.50 0.16 75)" },
  safety: { bg: "oklch(0.97 0.02 25)", border: "oklch(0.55 0.18 25)", label: "oklch(0.48 0.16 25)" },
  info: { bg: "oklch(0.97 0.015 155)", border: "oklch(0.50 0.14 155)", label: "oklch(0.42 0.14 155)" },
} as const;

// Difficulty
export const DIFFICULTY = {
  beginner: { label: "Beginner", accent: "oklch(0.52 0.14 155)", bg: "oklch(0.94 0.03 155)" },
  intermediate: { label: "Intermediate", accent: "oklch(0.58 0.16 75)", bg: "oklch(0.94 0.04 75)" },
  advanced: { label: "Advanced", accent: "oklch(0.52 0.18 25)", bg: "oklch(0.94 0.04 25)" },
} as const;

// Curriculum tiers (Resources)
export const CURRICULUM_LEVELS = {
  foundations: { color: "oklch(0.45 0.14 250)", label: "Foundations (all employees)" },
  practitioner: { color: "oklch(0.45 0.14 155)", label: "Practitioner" },
  advanced: { color: "oklch(0.50 0.14 300)", label: "Advanced / Champions" },
} as const;
