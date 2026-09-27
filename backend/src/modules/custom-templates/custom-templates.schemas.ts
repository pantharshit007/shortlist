import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";
import { texSourceSchema } from "../resumes/resumes.schemas.js";

export const customTemplateParams = z.object({ customTemplateId: z.uuid() });

const name = z.string().trim().min(1).max(80);

export const createCustomTemplateBody = z.discriminatedUnion("type", [
  // Saves a copy of a resume's current version.
  z.object({ type: z.literal("resume"), name, resumeId: z.uuid() }),
  z.object({ type: z.literal("tex"), name, texSource: texSourceSchema }),
]);

export const updateCustomTemplateBody = z
  .object({ name: name.optional(), texSource: texSourceSchema.optional() })
  .refine((body) => body.name !== undefined || body.texSource !== undefined, "Nothing to update");

export const customTemplateSummary = z.object({
  id: z.uuid(),
  name: z.string(),
  mode: z.enum(["structured", "code"]),
  templateId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const customTemplateDetail = customTemplateSummary.extend({
  content: resumeContentSchema.nullable(),
  texSource: z.string().nullable(),
});

export const customTemplateListResponse = z.array(customTemplateSummary);
