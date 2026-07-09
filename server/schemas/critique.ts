import { z } from "zod";

const rtcoField = z.enum(["present", "weak", "missing"]);

/**
 * One critique suggestion, tagged with the RTCO block it improves so the
 * Builder's "Add to <block>" button can route the snippet to the right field.
 */
export const SuggestionSchema = z
  .object({
    field: z.enum(["role", "task", "context", "output", "constraints"]),
    text: z.string().min(1),
  })
  .strict();

export const CritiqueSchema = z
  .object({
    rtco: z
      .object({
        role: rtcoField,
        task: rtcoField,
        context: rtcoField,
        output: rtcoField,
      })
      .strict(),
    anti_hallucination_clause: z.boolean(),
    specificity_issues: z.array(z.string()),
    suggestions: z.array(SuggestionSchema).min(1),
    cited_chapters: z.array(z.number().int().min(1).max(30)),
  })
  .strict();

export type Suggestion = z.infer<typeof SuggestionSchema>;
export type Critique = z.infer<typeof CritiqueSchema>;
