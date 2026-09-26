import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { templates } from "../../db/schema/index.js";
import { NotFoundError } from "../../lib/errors.js";

const columns = {
  id: templates.id,
  name: templates.name,
  description: templates.description,
  atsSafe: templates.atsSafe,
  version: templates.version,
};

export async function listTemplates() {
  return db.select(columns).from(templates).where(eq(templates.isActive, true)).orderBy(asc(templates.createdAt));
}

export async function assertTemplateExists(id: string) {
  const [template] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(and(eq(templates.id, id), eq(templates.isActive, true)))
    .limit(1);
  if (!template) throw new NotFoundError("Template");
}
