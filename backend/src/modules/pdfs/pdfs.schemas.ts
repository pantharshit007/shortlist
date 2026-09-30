import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";
import { resumeLayoutSchema } from "../../templates/layout.js";
import { texSourceSchema } from "../resumes/resumes.schemas.js";

export const resumePdfQuery = z.object({
  versionId: z.uuid().optional(),
  download: z.stringbool().default(false),
});

export const resumeExportQuery = z.object({ versionId: z.uuid().optional() });

export const createPreviewBody = z.union([
  z.object({
    templateId: z.string().default("developer"),
    content: resumeContentSchema,
    layout: resumeLayoutSchema.optional(),
  }),
  z.object({ texSource: texSourceSchema }),
]);
