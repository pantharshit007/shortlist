import { and, count, desc, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../../db/index.js";
import { customTemplates } from "../../db/schema/index.js";
import { AppError, NotFoundError } from "../../lib/errors.js";
import { resumeContentSchema } from "../../schemas/resume-content.js";
import { getResume } from "../resumes/resumes.service.js";
import type { createCustomTemplateBody, updateCustomTemplateBody } from "./custom-templates.schemas.js";

const MAX_CUSTOM_TEMPLATES = 20;

const summaryColumns = {
  id: customTemplates.id,
  name: customTemplates.name,
  mode: customTemplates.mode,
  templateId: customTemplates.templateId,
  createdAt: customTemplates.createdAt,
  updatedAt: customTemplates.updatedAt,
};

function toDetail(row: typeof customTemplates.$inferSelect) {
  const { userId: _userId, ...rest } = row;
  return { ...rest, content: row.content ? resumeContentSchema.parse(row.content) : null };
}

export async function listCustomTemplates(userId: string) {
  return db
    .select(summaryColumns)
    .from(customTemplates)
    .where(eq(customTemplates.userId, userId))
    .orderBy(desc(customTemplates.updatedAt));
}

export async function getCustomTemplate(userId: string, customTemplateId: string) {
  const [row] = await db
    .select()
    .from(customTemplates)
    .where(and(eq(customTemplates.id, customTemplateId), eq(customTemplates.userId, userId)))
    .limit(1);
  if (!row) throw new NotFoundError("Template");
  return toDetail(row);
}

export async function createCustomTemplate(userId: string, input: z.infer<typeof createCustomTemplateBody>) {
  const [existing] = await db
    .select({ total: count() })
    .from(customTemplates)
    .where(eq(customTemplates.userId, userId));
  if ((existing?.total ?? 0) >= MAX_CUSTOM_TEMPLATES) {
    throw new AppError(
      403,
      "CUSTOM_TEMPLATE_LIMIT",
      `You can keep up to ${MAX_CUSTOM_TEMPLATES} templates. Delete one to add another.`,
    );
  }

  let values: Omit<typeof customTemplates.$inferInsert, "userId" | "name">;
  if (input.type === "tex") {
    values = { mode: "code", texSource: input.texSource };
  } else {
    const resume = await getResume(userId, input.resumeId);
    if (!resume.head) throw new NotFoundError("Version");
    values = resume.head.content
      ? { mode: "structured", templateId: resume.templateId, content: resume.head.content }
      : { mode: "code", texSource: resume.head.texSource };
  }

  const [row] = await db
    .insert(customTemplates)
    .values({ userId, name: input.name, ...values })
    .returning();
  return toDetail(row!);
}

export async function updateCustomTemplate(
  userId: string,
  customTemplateId: string,
  changes: z.infer<typeof updateCustomTemplateBody>,
) {
  const current = await getCustomTemplate(userId, customTemplateId);
  if (changes.texSource !== undefined && current.mode !== "code") {
    throw new AppError(400, "TEX_NOT_ALLOWED", "Only LaTeX templates can have their code edited");
  }
  const [row] = await db
    .update(customTemplates)
    .set({ ...changes, updatedAt: new Date() })
    .where(and(eq(customTemplates.id, customTemplateId), eq(customTemplates.userId, userId)))
    .returning();
  return toDetail(row!);
}

export async function deleteCustomTemplate(userId: string, customTemplateId: string) {
  const deleted = await db
    .delete(customTemplates)
    .where(and(eq(customTemplates.id, customTemplateId), eq(customTemplates.userId, userId)))
    .returning({ id: customTemplates.id });
  if (deleted.length === 0) throw new NotFoundError("Template");
}
