import { z } from "zod";

export const PreviewSchema = z
  .object({
    interpretation: z.string().min(1),
    gaps: z.array(z.string()),
    unclear: z.array(z.string()),
  })
  .strict();

export type Preview = z.infer<typeof PreviewSchema>;
