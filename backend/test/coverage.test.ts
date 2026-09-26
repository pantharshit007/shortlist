import { describe, expect, it } from "vitest";
import { coverageReport } from "../src/modules/coverage/coverage.js";
import { resumeContentSchema } from "../src/schemas/resume-content.js";

const resume = resumeContentSchema.parse({
  basics: { name: "S" },
  sections: [
    {
      id: "sk",
      type: "skills",
      title: "Skills",
      groups: [{ id: "g", name: "Languages", items: ["Go", "Node.js", "PostgreSQL"] }],
    },
    {
      id: "ex",
      type: "experience",
      title: "Experience",
      entries: [
        {
          id: "e",
          organization: "Google",
          role: "SWE",
          bullets: [{ id: "b", text: "Hidden Kafka work", hidden: true }],
        },
      ],
    },
  ],
});
const profile = resumeContentSchema.parse({
  basics: { name: "S" },
  sections: [{ id: "sk", type: "skills", title: "Skills", groups: [{ id: "g", name: "Tools", items: ["Docker"] }] }],
});

describe("coverageReport", () => {
  it("classifies requirements as covered, in profile or missing", () => {
    const report = coverageReport(
      { mustHave: ["Go", "node.js", "Kubernetes"], niceToHave: ["Docker", "Kafka"], keywords: [] },
      { content: resume, texSource: null },
      profile,
    );
    const status = Object.fromEntries([...report.mustHave, ...report.niceToHave].map((r) => [r.requirement, r.status]));
    expect(status).toEqual({
      Go: "covered",
      "node.js": "covered",
      Kubernetes: "missing",
      Docker: "in_profile",
      Kafka: "missing",
    });
    expect(report.mustHave[0]!.foundIn).toEqual(["Skills"]);
    expect(report).toMatchObject({ covered: 2, total: 5 });
  });

  it("does not match a term inside another word", () => {
    const report = coverageReport(
      { mustHave: ["Go"], niceToHave: [], keywords: [] },
      {
        content: resumeContentSchema.parse({
          basics: { name: "S" },
          sections: [{ id: "x", type: "list", title: "Awards", entries: [{ id: "a", title: "Google Code Jam" }] }],
        }),
        texSource: null,
      },
      profile,
    );
    expect(report.mustHave[0]!.status).toBe("missing");
  });
});
