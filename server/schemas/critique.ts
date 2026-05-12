import { z } from "zod";

const rtcoField = z.enum(["present", "weak", "missing"]);

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
    suggestions: z.array(z.string()),
    cited_chapters: z.array(z.number().int().min(1).max(30)),
  })
  .strict();

export type Critique = z.infer<typeof CritiqueSchema>;
