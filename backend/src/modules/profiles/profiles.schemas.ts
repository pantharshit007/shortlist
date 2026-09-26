import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";

export const profileResponse = z.object({
  content: resumeContentSchema,
  updatedAt: z.date().nullable(),
});

export const putProfileBody = z.object({ content: resumeContentSchema });
