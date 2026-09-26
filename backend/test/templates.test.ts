import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { createTectonic } from "../src/lib/latex/tectonic.js";
import { resumeContentSchema } from "../src/schemas/resume-content.js";
import { templates } from "../src/templates/index.js";
import { sampleResume } from "../src/templates/sample.js";

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
