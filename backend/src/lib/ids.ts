import { randomBytes } from "node:crypto";

// Short ids for sections, entries and bullets inside resume JSON.
export function shortId() {
  return randomBytes(6).toString("base64url");
}
