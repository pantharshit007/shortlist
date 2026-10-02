import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createTectonic } from "../src/lib/latex/tectonic.js";
import { resumeContentSchema } from "../src/schemas/resume-content.js";
import { templates } from "../src/templates/index.js";
import { sampleResume } from "../src/templates/sample.js";
import { leadsWithEducation } from "../src/templates/shared-business.js";

const hasTectonic = (() => {
  try {
    execFileSync("tectonic", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

const compile = createTectonic({ bin: "tectonic", onlyCached: false, timeoutMs: 120_000, concurrency: 2 });
const bare = resumeContentSchema.parse({ basics: { name: "Only Name" }, sections: [] });

describe.skipIf(!hasTectonic)("templates compile", () => {
  for (const template of templates) {
    it(`${template.id} with full content`, async () => {
      const result = await compile(template.render(sampleResume));
      expect(result.ok, JSON.stringify(result)).toBe(true);
    });

    it(`${template.id} with a summary section`, async () => {
      const text = "Analyst with **5 years** in M&A and 20% growth, focused on #fintech.";
      const withSummary = {
        ...sampleResume,
        sections: [
          { id: "summary", title: "Summary", hidden: false, type: "summary" as const, text },
          ...sampleResume.sections,
        ],
      };
      const tex = template.render(withSummary);
      expect(tex).toContain("5 years");
      const result = await compile(tex);
      expect(result.ok, JSON.stringify(result)).toBe(true);
    });

    it(`${template.id} with only a name`, async () => {
      const result = await compile(template.render(bare));
      expect(result.ok, JSON.stringify(result)).toBe(true);
    });

    it(`${template.id} with every spacing preset and font size`, async () => {
      for (const layout of [
        { spacing: "compact", fontSize: 10 },
        { spacing: "relaxed", fontSize: 12 },
      ] as const) {
        const result = await compile(template.render(sampleResume, layout));
        expect(result.ok, JSON.stringify(result)).toBe(true);
      }
    });
  }
});

describe("templates hide content", () => {
  it("omits hidden bullets, entries and sections", () => {
    const content = structuredClone(sampleResume);
    const experience = content.sections.find((s) => s.type === "experience");
    if (experience?.type !== "experience") throw new Error("fixture changed");
    experience.entries[0]!.bullets[0]!.hidden = true;
    const skills = content.sections.find((s) => s.type === "skills")!;
    skills.hidden = true;

    for (const template of templates) {
      const texSource = template.render(content);
      expect(texSource).not.toContain("payouts API");
      expect(texSource).not.toContain("Technical Skills");
    }
  });
});

// sha256 of each template's sample render before layouts existed. The default layout must not change a byte;
// if the sample or a template changes on purpose, update the hash.
const beforeLayouts: Record<string, string> = {
  developer: "0fc52d4d70fdb652f3cb1fb91e69e0e32c2f051a34bd26bdcc3460da6678b689",
  jake: "848e14028696399f74e06f29953b00b1914b24965644071de57ca52161b78736",
  modern: "9bc7ee57f6a60a8bc7cca944f87d7d6a0822332efee7d376c69cc5147a5eacb8",
  sb2nov: "73aecf19979e2d095c4ebe42926e1b6187ea369ac76df6cd87161cb4b678f809",
  "ml-research": "f6f76c0fac80d4cf52eb7e606f2570609976f37a1024a93c7aa74e1734b72a7c",
  "data-analyst": "3996ab2e00140599e42fac80df52c8be6a8aed2a6dcb2336d6dc86a3f189c576",
  "product-manager": "44df207ce4e739632ec4951045e2dd79209d8c3b3328037e337468af7b17097c",
  designer: "6bf8363624239681f0aa5112c7df477e73e00dd4438672f405d03aa0d220b54d",
  campus: "e33a623ba1ddd53c298ffb3429abc38763702518b2365c0a06e6624620e9ea67",
  banking: "d2129a2b48d7b013ebc12096fc6b5cbfe7186a0e793eace52d4baa3f0e2ceac6",
  finance: "c28d86dc8ca4b7dd9beb89b52ddc09a9661660f57e017a1a7ece960866338174",
  consulting: "82a1c70442a1dd4e92774596ea392119f4d3737ae781d79fa0cc75dafe8a52eb",
  marketing: "e461e4044aff9b8c45090acc7867c3c7434bfa07e564b51006086d7b057e9f09",
  executive: "9fe2babff113530db377c8cbd64163e90d01a133752df0c800b2f934153a100e",
};

describe("default layout", () => {
  const sha = (texSource: string) => createHash("sha256").update(texSource).digest("hex");
  for (const template of templates) {
    it(`${template.id} renders exactly as before`, () => {
      expect(sha(template.render(sampleResume))).toBe(beforeLayouts[template.id]);
      expect(sha(template.render(sampleResume, { spacing: "normal" }))).toBe(beforeLayouts[template.id]);
    });
  }

  it("changes the font size and spacing when asked", () => {
    const texSource = templates[0]!.render(sampleResume, { spacing: "compact", fontSize: 12 });
    expect(texSource).toMatch(/^\\documentclass\[letterpaper,12pt\]/);
    expect(texSource).toContain("\\linespread{0.95}");
  });
});

describe("leadsWithEducation", () => {
  it("puts education first early in a career", () => {
    expect(leadsWithEducation(sampleResume.sections)).toBe(true);
    expect(leadsWithEducation([])).toBe(true);
  });

  it("puts experience first after two roles since graduating", () => {
    const sections = sampleResume.sections.map((section) => {
      if (section.type === "education")
        return { ...section, entries: section.entries.map((e) => ({ ...e, start: "2017-07", end: "2021-05" })) };
      if (section.type === "experience") {
        const [first] = section.entries;
        return {
          ...section,
          entries: [
            { ...first!, start: "2021-07" },
            { ...first!, id: `${first!.id}-2`, start: "2023-01" },
          ],
        };
      }
      return section;
    });
    expect(leadsWithEducation(sections)).toBe(false);
  });
});
