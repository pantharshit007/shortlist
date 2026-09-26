import { z } from "zod";

export const uploadParams = z.object({ uploadId: z.uuid() });

export const uploadResponse = z.object({
  id: z.uuid(),
  kind: z.enum(["pdf", "tex", "text"]),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  createdAt: z.date(),
});
