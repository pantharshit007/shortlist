import { z } from "zod";

export const templateResponse = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  atsSafe: z.boolean(),
  version: z.number().int(),
});

export const templateListResponse = z.array(templateResponse);
