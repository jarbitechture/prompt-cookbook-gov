/**
 * prompts.test.ts — Task #10 static refusal-directive checks
 *
 * Asserts that each system prompt .md file contains the key directives
 * required by the county AI governance contract:
 *   - Domain lock (no factual county content)
 *   - Refusal pattern (do not fabricate)
 *   - Chapter citation rule (cite by number only)
 *   - Output rule (JSON only)
 *
 * These checks do NOT require a real LLM call. They verify the source
 * files at the path used by llm-endpoints.ts at module init time.
 *
 * Part of the "FACTUAL COUNTY CONTENT" fixture contract from Task #10:
 * since mocked civic-ai cannot verify prompt-induced refusal, we assert
 * the refusal directive is present in the prompt source.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = __dirname;

function readPrompt(mode: "critique" | "refine" | "preview"): string {
  return fs.readFileSync(path.join(PROMPTS_DIR, `${mode}.md`), "utf-8");
}

// ─── Per-file assertions ──────────────────────────────────────────────────────

const MODES = ["critique", "refine", "preview"] as const;

describe("system prompt static checks — domain lock + refusal directive", () => {
  for (const mode of MODES) {
    describe(`${mode}.md`, () => {
      const content = readPrompt(mode);

      it("contains domain lock forbidding factual county answers", () => {
        // All three prompts must explicitly restrict answering factual county questions
        expect(content).toMatch(
          /do not answer factual questions|Your only job is to (evaluate|rewrite|preview)/i
        );
      });

      it("contains refusal pattern for county-specific content", () => {
        // Must have an explicit refusal/placeholder directive
        expect(content).toMatch(/Refusal pattern|do not fabricate|placeholder/i);
      });

      it("contains chapter citation rule", () => {
        expect(content).toMatch(/cite.*chapter.*number|chapter.*NUMBER only/i);
      });

      it("contains output rule requiring JSON", () => {
        expect(content).toMatch(/valid JSON|JSON object/i);
      });
    });
  }
});

describe("system prompt static checks — no hallucination patterns in source", () => {
  for (const mode of MODES) {
    it(`${mode}.md does not contain a Florida statute citation example that could leak into output`, () => {
      const content = readPrompt(mode);
      // Prompt files should reference statute topics conceptually, not cite actual statute numbers
      // This guards against prompts that accidentally demonstrate the pattern we're trying to prevent.
      // Fla. Stat. §, F.S. NNN.NN — actual citation format (not just the word "statute")
      expect(content).not.toMatch(/Fla\.\s*Stat\.\s*§\s*\d+/);
      expect(content).not.toMatch(/F\.S\.\s+\d{3,}/);
    });
  }
});
