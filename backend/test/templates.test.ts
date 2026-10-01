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
  developer: "52e889322951601162f7ffde2d160a31e21ae565ff625798849fbbace99d5ba4",
  jake: "6ebbea68b8ea5d33f3ad1aaf6ecf65659705bf888d5b9a410fcc9ffbee09334a",
  modern: "0aad9170b5b335eee10bfe4a7eb3b27937b908acd4c55c2f1cc10a3987517882",
  sb2nov: "95ca4558891322201168ca545b126e7cf166b9eb669c80b93bc56c8cb73c354c",
  "ml-research": "15e8de1504135ab5ab3e3f3af0087df918325503421d3d26e3109535e26ba0a8",
  "data-analyst": "304ee7b0da9f6598cc64238b938f89e6037dabb4af8d25c2191d2dca7ffc560c",
  "product-manager": "03cc2aaf989aa24a0592ba0e0e66d7b1d40d3a51afdd16c9205da092aa97a260",
  designer: "6bf8363624239681f0aa5112c7df477e73e00dd4438672f405d03aa0d220b54d",
  campus: "1b9b25e9af2bedbc58d8e3fda9f3463c2e977ef471e311026b220f6052183100",
  banking: "a71db1facb14964efc97386bd4ccd82137f9160150b7cd647131f4d28c0e50ed",
  finance: "c732276ceb2c98c4123749a5066b92c9a223211c7941c559fb2a7edc1b112918",
  consulting: "170df2717e52801f301661f61849bb033f7ab07d11d963ea66cc3b039b3287a0",
  marketing: "11b95d628d50e1ab21785447d9d3ad5b5b073f473f70fcce6238e545519a873c",
  executive: "ca80c387c1b71677c4c59bca96e31e223199071efbca45158853df4deba796f7",
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
