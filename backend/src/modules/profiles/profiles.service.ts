import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema/index.js";
import { emptyResumeContent, type ResumeContent, resumeContentSchema } from "../../schemas/resume-content.js";

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!profile) return { content: emptyResumeContent, updatedAt: null };
  return { content: resumeContentSchema.parse(profile.data), updatedAt: profile.updatedAt };
}

export async function putProfile(userId: string, content: ResumeContent) {
  const [profile] = await db
    .insert(profiles)
    .values({ userId, data: content })
    .onConflictDoUpdate({ target: profiles.userId, set: { data: content, updatedAt: new Date() } })
    .returning();
  return { content, updatedAt: profile!.updatedAt };
}
