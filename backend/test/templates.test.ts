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
const nameless = resumeContentSchema.parse({ basics: { name: "", headline: "Data Analyst" }, sections: [] });

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

    it(`${template.id} with no name yet`, async () => {
      const result = await compile(template.render(nameless));
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
  developer: "e49d5d9167e57b5d8d991a77e4654ce86868228a6d3c787a712ff64b7ac7cc7a",
  jake: "4e7af6b01e20d855ccf5bcd541d4a4814c26a72cbcae3a77e9fa4af6c9b6f70b",
  modern: "6c7c75ec71df93475a9447f0decc9f8413d795e8b51c44bdc712795d10f63249",
  sb2nov: "1ce48352bb666a983bc617a82dccf8054881d903c204b47eef6ecee767c6f986",
  "ml-research": "e7b651bb55b643dcfd121d39b7ad5b18af863d366db1c5956203e808d02f111c",
  "data-analyst": "0fa331493ea00451d4c4e8e933d6e35cc95d4b6e4e5d7c2ab5c13fa45af81ec2",
  "product-manager": "1648ed4180e49953eb51d8f69f5c876ac545d9b9b0374a9fb4907ebe9d4def73",
  designer: "ed718e22634f76d8f6df87c6219fc0fe4c93b3293d1a3375883200be476277c3",
  campus: "3287410966c8ab5bea26c77ca803fc0e4e396236a7fcd6c4e02fb62afd2a58f6",
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
