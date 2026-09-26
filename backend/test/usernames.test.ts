import { describe, expect, it } from "vitest";
import { isReservedUsername, slugify, USERNAME_PATTERN } from "../src/modules/users/usernames.js";

describe("usernames", () => {
  it("slugifies names", () => {
    expect(slugify("Saurav Jhá!!")).toBe("saurav-jha");
    expect(slugify("  ")).toBe("");
    expect(slugify("A".repeat(40))).toHaveLength(24);
  });

  it("enforces the username format", () => {
    for (const valid of ["abc", "saurav-jha", "a1-b2"]) expect(USERNAME_PATTERN.test(valid)).toBe(true);
    for (const invalid of ["ab", "-abc", "abc-", "Saurav", "a_b", "a".repeat(31)]) expect(USERNAME_PATTERN.test(invalid)).toBe(false);
  });

  it("reserves app routes", () => {
    expect(isReservedUsername("api")).toBe(true);
    expect(isReservedUsername("saurav")).toBe(false);
  });
});
