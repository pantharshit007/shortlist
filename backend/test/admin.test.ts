import { describe, expect, it } from "vitest";
import { isAdmin } from "../src/middleware/require-admin.js";

describe("isAdmin", () => {
  it("matches listed emails case-insensitively", () => {
    expect(isAdmin({ email: "admin@example.com", emailVerified: true })).toBe(true);
    expect(isAdmin({ email: "SECOND@example.com", emailVerified: true })).toBe(true);
  });

  it("never trusts an unverified email", () => {
    expect(isAdmin({ email: "admin@example.com", emailVerified: false })).toBe(false);
  });

  it("rejects everyone else", () => {
    expect(isAdmin({ email: "someone@example.com", emailVerified: true })).toBe(false);
    expect(isAdmin({ email: "", emailVerified: true })).toBe(false);
  });
});
