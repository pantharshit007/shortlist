import { describe, expect, it } from "vitest";
import { redact } from "../src/lib/ai/redact.js";
import { unverifiedTerms } from "../src/modules/suggestions/operations.js";
import { resumeContentSchema } from "../src/schemas/resume-content.js";

const content = resumeContentSchema.parse({
  basics: {
    name: "Asha Rao",
    email: "asha@acme.dev",
    phone: "+91 98765 43210",
    location: "Pune",
    sensitive: ["location"],
    links: [
      { label: "GitHub", url: "https://github.com/asha", sensitive: true },
      { label: "Blog", url: "https://asha.blog" },
    ],
  },
  sections: [
    {
      id: "ex",
      type: "experience",
      title: "Experience",
      entries: [
        {
          id: "e1",
          organization: "Acme",
          sensitive: true,
          role: "SDE",
          bullets: [{ id: "b1", text: "Built billing at Acme in Go" }],
        },
      ],
    },
  ],
});
const secrets = ["asha@acme.dev", "+91 98765 43210", "Pune", "https://github.com/asha", "Acme"];

describe("redact", () => {
  it("masks sensitive values and restores them in model output", () => {
    const prompt = `<resume>${JSON.stringify(content)}</resume>\n\\href{mailto:asha@acme.dev}{Call 9876543210}`;
    const { text, restore } = redact(prompt, [content]);
    for (const secret of secrets) expect(text).not.toContain(secret);
    expect(text).not.toContain("9876543210");
    expect(text).toContain("Asha Rao");
    expect(text).toContain("https://asha.blog");

    const output = { text: "Led billing at [company 1]; reach me at [email 1]", ops: ["[location 1]"] };
    expect(restore(output)).toEqual({ text: "Led billing at Acme; reach me at asha@acme.dev", ops: ["Pune"] });
    expect(restore(JSON.parse(text.slice(8, text.indexOf("</resume>"))))).toEqual(content);
    expect(unverifiedTerms(restore("Led billing at [company 1]"), [JSON.stringify(content)])).toEqual([]);
  });

  it("changes nothing when no values are sensitive", () => {
    const plain = resumeContentSchema.parse({ basics: { name: "Asha", location: "Pune" }, sections: [] });
    const prompt = JSON.stringify(plain);
    const { text, restore } = redact(prompt, [plain]);
    expect(text).toBe(prompt);
    expect(restore("[email 1]")).toBe("[email 1]");
  });
});
