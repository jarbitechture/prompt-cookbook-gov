import { z } from "zod";

export const RefineSchema = z
  .object({
    rewritten: z.string(),
    applied_techniques: z.array(z.number().int().min(1).max(30)),
    notes: z.string().min(1),
  })
  .strict();

export type Refine = z.infer<typeof RefineSchema>;
