import { describe, expect, it } from "vitest";
import { hashPassword } from "../src/lib/passwords.js";
import { contactAccess, maskContact } from "../src/modules/public/public.service.js";
import { resumeContentSchema } from "../src/schemas/resume-content.js";

describe("contact password", async () => {
  const link = { showContact: false, contactPasswordHash: await hashPassword("open-sesame") };

  it("keeps contacts locked until the right password", async () => {
    expect(await contactAccess(link, "pro", undefined)).toBe("locked");
    expect(await contactAccess(link, "pro", "wrong")).toBe("locked");
    expect(await contactAccess(link, "season_pass", "open-sesame")).toBe("shown");
  });

  it("falls back to hidden when the owner is back on the free plan", async () => {
    expect(await contactAccess(link, "free", "open-sesame")).toBe("hidden");
  });

  it("leaves the free shown and hidden choices alone", async () => {
    expect(await contactAccess({ showContact: true, contactPasswordHash: null }, "free", undefined)).toBe("shown");
    expect(await contactAccess({ showContact: false, contactPasswordHash: null }, "pro", "x")).toBe("hidden");
  });

  it("strips email and phone when masked", () => {
    const content = resumeContentSchema.parse({
      basics: { name: "Asha", email: "a@b.dev", phone: "+91 1" },
      sections: [],
    });
    expect(maskContact(content).basics).not.toHaveProperty("email");
    expect(maskContact(content).basics).not.toHaveProperty("phone");
  });
});
