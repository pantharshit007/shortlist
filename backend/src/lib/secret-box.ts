import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

// AES-256-GCM for small secrets stored in the database, such as users' own AI keys.
const key = env.AI_KEY_ENCRYPTION_SECRET
  ? createHash("sha256").update(env.AI_KEY_ENCRYPTION_SECRET).digest()
  : Buffer.from(hkdfSync("sha256", env.BETTER_AUTH_SECRET, "", "user-ai-keys", 32));

export function seal(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), body]
    .map((part) => (typeof part === "string" ? part : part.toString("base64url")))
    .join(".");
}

export function open(sealed: string) {
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Unrecognised sealed value");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}
