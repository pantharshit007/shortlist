import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";

export const publicUserParams = z.object({ username: z.string().trim().toLowerCase().max(40) });
export const publicResumeParams = publicUserParams.extend({ slug: z.string().trim().toLowerCase().max(40) });

export const publicProfileResponse = z.object({
  username: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  resumes: z.array(z.object({ slug: z.string(), title: z.string(), hasPassword: z.boolean(), updatedAt: z.date() })),
});

export const publicResumeResponse = z.object({
  // The owner's current username; differs from the URL when an old username was used.
  username: z.string(),
  slug: z.string(),
  title: z.string(),
  mode: z.enum(["structured", "code"]),
  templateId: z.string().nullable(),
  // Null for code-mode resumes, which are only available as PDF.
  content: resumeContentSchema.nullable(),
  contactMasked: z.boolean(),
  // Contacts are hidden but a visitor with the contact password can reveal them.
  contactLocked: z.boolean(),
  updatedAt: z.date(),
});
