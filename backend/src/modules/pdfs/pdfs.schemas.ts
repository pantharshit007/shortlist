import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";
import { texSourceSchema } from "../resumes/resumes.schemas.js";

export const resumePdfQuery = z.object({
  versionId: z.uuid().optional(),
  download: z.stringbool().default(false),
});

export const createPreviewBody = z.union([
  z.object({ templateId: z.string().default("jake"), content: resumeContentSchema }),
  z.object({ texSource: texSourceSchema }),
]);
