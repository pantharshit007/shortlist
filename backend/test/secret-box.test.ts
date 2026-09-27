import { describe, expect, it } from "vitest";
import { open, seal } from "../src/lib/secret-box.js";

describe("secret box", () => {
  it("round-trips a key and never stores it in plain text", () => {
    const sealed = seal("sk-test-1234567890abcdef");
    expect(sealed).not.toContain("sk-test");
    expect(open(sealed)).toBe("sk-test-1234567890abcdef");
  });

  it("uses a fresh nonce each time", () => {
    expect(seal("same")).not.toBe(seal("same"));
  });

  it("rejects a tampered value", () => {
    const [version, iv, tag, body] = seal("secret").split(".");
    const flipped = Buffer.from(body!, "base64url");
    flipped[0] = flipped[0]! ^ 1;
    expect(() => open([version, iv, tag, flipped.toString("base64url")].join("."))).toThrow();
  });
});
