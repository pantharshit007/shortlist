import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { uploads } from "../../db/schema/index.js";
import { AppError, NotFoundError } from "../../lib/errors.js";
import { storage } from "../../lib/storage.js";

type UploadKind = (typeof uploads.$inferInsert)["kind"];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Trusts file contents, not the client's declared type.
function detectKind(fileName: string, body: Buffer): UploadKind {
  if (body.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  if (body.includes(0)) throw new AppError(415, "UNSUPPORTED_FILE", "Upload a PDF, .tex or .txt file");
  return /\.tex$/i.test(fileName) || /\\documentclass/.test(body.toString("utf8", 0, 4096)) ? "tex" : "text";
}

const mimeTypes: Record<UploadKind, string> = { pdf: "application/pdf", tex: "application/x-tex", text: "text/plain" };

export async function createUpload(userId: string, file: { originalname: string; buffer: Buffer }) {
  const kind = detectKind(file.originalname, file.buffer);
  const id = randomUUID();
  const storageKey = `users/${userId}/uploads/${id}`;
  await storage.put(storageKey, file.buffer, mimeTypes[kind]);

  const [upload] = await db
    .insert(uploads)
    .values({
      id,
      userId,
      kind,
      storageKey,
      fileName: file.originalname.slice(0, 200),
      mimeType: mimeTypes[kind],
      sizeBytes: file.buffer.length,
    })
    .returning();
  return upload!;
}

export async function getOwnedUpload(userId: string, uploadId: string) {
  const [upload] = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.id, uploadId), eq(uploads.userId, userId)))
    .limit(1);
  if (!upload) throw new NotFoundError("Upload");
  return upload;
}

export async function readUpload(userId: string, uploadId: string) {
  const upload = await getOwnedUpload(userId, uploadId);
  const body = await storage.get(upload.storageKey);
  if (!body) throw new NotFoundError("Upload file");
  return { upload, body };
}

export async function deleteUpload(userId: string, uploadId: string) {
  const upload = await getOwnedUpload(userId, uploadId);
  await storage.deletePrefix(upload.storageKey);
  await db.delete(uploads).where(eq(uploads.id, upload.id));
}
