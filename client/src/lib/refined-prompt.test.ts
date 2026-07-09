import { describe, it, expect } from "vitest";
import { parseRefinedRtco } from "./refined-prompt";

describe("parseRefinedRtco", () => {
  it("parses a gemma3:4b one-paragraph rewrite and strips the schema leak", () => {
    // Captured verbatim shape from /api/refine against the dev model.
    const raw =
      "You are a county budget analyst. Task: Draft a memo to department heads " +
      "summarizing the findings of the quarterly budget review. Context: The review " +
      "focused on departmental spending against allocated budgets for Q3 2024. " +
      "Output format: Format the memo as a standard business memo. " +
      "Applied techniques: [24]\nNotes: Added RTCO components.";
    const r = parseRefinedRtco(raw);

    expect(r.role).toBe("county budget analyst");
    expect(r.task).toContain("Draft a memo");
    expect(r.context).toContain("Q3 2024");
    expect(r.output).toContain("business memo");
    // The leaked sibling fields must not survive into any block.
    expect(JSON.stringify(r)).not.toMatch(/Applied techniques/i);
    expect(JSON.stringify(r)).not.toMatch(/Notes\s*:/i);
  });

  it("parses a strictly newline-labeled prompt into all five blocks", () => {
    const raw =
      "Role: budget analyst\nTask: write a memo\nContext: quarterly review\n" +
      "Output: bulleted list\nConstraints: under 300 words";
    expect(parseRefinedRtco(raw)).toEqual({
      role: "budget analyst",
      task: "write a memo",
      context: "quarterly review",
      output: "bulleted list",
      constraints: "under 300 words",
    });
  });

  it("falls back to Task when no RTCO labels are present", () => {
    const r = parseRefinedRtco("Just write something useful for the team.");
    expect(r.task).toBe("Just write something useful for the team.");
    expect(r.role).toBeUndefined();
  });
});
