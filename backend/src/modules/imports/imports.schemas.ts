import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";

export const createImportBody = z.union([
  z.object({ uploadId: z.uuid() }),
  z.object({ text: z.string().trim().min(20).max(50_000) }),
]);

export const createDraftBody = z.object({
  role: z.string().trim().min(2).max(100),
  notes: z.string().trim().min(40).max(20_000),
});

export const importResponse = z.object({
  content: resumeContentSchema,
  aiRunId: z.uuid(),
});
