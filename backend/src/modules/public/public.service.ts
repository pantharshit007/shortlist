import { createHmac } from "node:crypto";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { linkViews, resumes, shareLinks, usernameRedirects, users } from "../../db/schema/index.js";
import { AppError, NotFoundError } from "../../lib/errors.js";
import { verifyPassword } from "../../lib/passwords.js";
import type { ResumeContent } from "../../schemas/resume-content.js";
import { getVersion } from "../resumes/resumes.service.js";

export type Viewer = {
  userId?: string | undefined;
  visitorKey: string;
  userAgent: string;
  referrer?: string | undefined;
  country?: string | undefined;
};

async function resolveUser(username: string) {
  const columns = { id: users.id, username: users.username, name: users.name, image: users.image };
  const [user] = await db.select(columns).from(users).where(eq(users.username, username)).limit(1);
  if (user) return user;
  const [redirected] = await db
    .select(columns)
    .from(usernameRedirects)
    .innerJoin(users, eq(users.id, usernameRedirects.userId))
    .where(eq(usernameRedirects.oldUsername, username))
    .limit(1);
  if (!redirected) throw new NotFoundError("User");
  return redirected;
}

const activeLink = () =>
  and(isNull(shareLinks.deletedAt), or(isNull(shareLinks.expiresAt), gt(shareLinks.expiresAt, new Date())));

export async function getPublicProfile(username: string) {
  const user = await resolveUser(username);
  const listed = await db
    .select({
      slug: shareLinks.slug,
      title: resumes.title,
      passwordHash: shareLinks.passwordHash,
      updatedAt: resumes.updatedAt,
    })
    .from(shareLinks)
    .innerJoin(resumes, eq(resumes.id, shareLinks.resumeId))
    .where(and(eq(shareLinks.userId, user.id), eq(shareLinks.isListed, true), activeLink(), isNull(resumes.deletedAt)))
    .orderBy(desc(resumes.updatedAt));
  return {
    username: user.username,
    name: user.name,
    image: user.image,
    resumes: listed.map(({ passwordHash, ...rest }) => ({ ...rest, hasPassword: Boolean(passwordHash) })),
  };
}

export function maskContact(content: ResumeContent): ResumeContent {
  const { email: _email, phone: _phone, ...basics } = content.basics;
  return { ...content, basics };
}

async function resolveLink(username: string, slug: string, password: string | undefined) {
  const user = await resolveUser(username);
  const [row] = await db
    .select({ link: shareLinks, resume: resumes })
    .from(shareLinks)
    .innerJoin(resumes, eq(resumes.id, shareLinks.resumeId))
    .where(and(eq(shareLinks.userId, user.id), eq(shareLinks.slug, slug), isNull(shareLinks.deletedAt), isNull(resumes.deletedAt)))
    .limit(1);
  if (!row) throw new NotFoundError("Resume");
  if (row.link.expiresAt && row.link.expiresAt <= new Date()) {
    throw new AppError(410, "LINK_EXPIRED", "This link has expired");
  }
  if (row.link.passwordHash && !(password && (await verifyPassword(password, row.link.passwordHash)))) {
    throw new AppError(401, "PASSWORD_REQUIRED", "This resume is password protected");
  }

  const versionId = row.link.pinnedVersionId ?? row.resume.headVersionId;
  if (!versionId) throw new NotFoundError("Resume");
  const version = await getVersion(user.id, row.resume.id, versionId);
  const content = version.content && !row.link.showContact ? maskContact(version.content) : version.content;
  return { user, link: row.link, resume: row.resume, version: { ...version, content } };
}

const botPattern = /bot|crawler|spider|preview|facebookexternalhit|slurp|headless/i;

async function recordView(link: typeof shareLinks.$inferSelect, viewer: Viewer) {
  if (viewer.userId === link.userId || botPattern.test(viewer.userAgent)) return;

  // Keyed hash with a daily component: counts unique visitors without storing IPs.
  const day = new Date().toISOString().slice(0, 10);
  const visitorHash = createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${viewer.visitorKey}|${viewer.userAgent}|${day}`)
    .digest("hex");
  const device = /ipad|tablet/i.test(viewer.userAgent) ? "tablet" : /mobile|android|iphone/i.test(viewer.userAgent) ? "mobile" : "desktop";
  const referrer = URL.canParse(viewer.referrer ?? "") ? new URL(viewer.referrer!).hostname : null;

  await db.insert(linkViews).values({
    shareLinkId: link.id,
    visitorHash,
    referrer,
    country: viewer.country?.slice(0, 2).toUpperCase() ?? null,
    device,
  });
  await db
    .update(shareLinks)
    .set({ viewCount: sql`${shareLinks.viewCount} + 1`, lastViewedAt: new Date() })
    .where(eq(shareLinks.id, link.id));
}

export async function getPublicResume(username: string, slug: string, password: string | undefined, viewer: Viewer) {
  const { user, link, resume, version } = await resolveLink(username, slug, password);
  await recordView(link, viewer);
  return {
    data: {
      username: user.username,
      slug: link.slug,
      title: resume.title,
      mode: resume.mode,
      templateId: resume.templateId,
      content: version.content,
      contactMasked: !link.showContact,
      updatedAt: resume.updatedAt,
    },
    isListed: link.isListed,
  };
}

export async function getPublicResumeForPdf(username: string, slug: string, password: string | undefined) {
  const { resume, version, link } = await resolveLink(username, slug, password);
  return { resume, version, isListed: link.isListed };
}
