import { describe, expect, it } from "vitest";
import { type Extraction, normalizeExtraction } from "../src/modules/imports/extraction.js";

const entry = (fields: Partial<Extraction["sections"][number]["entries"][number]>) => ({
  organization: null,
  role: null,
  institution: null,
  degree: null,
  field: null,
  score: null,
  name: null,
  title: null,
  subtitle: null,
  url: null,
  location: null,
  start: null,
  end: null,
  date: null,
  technologies: [],
  links: [],
  bullets: [],
  ...fields,
});

describe("normalizeExtraction", () => {
  it("cleans model output into valid resume content", () => {
    const content = normalizeExtraction({
      basics: {
        name: " Saurav Jha ",
        headline: "",
        email: "not-an-email",
        phone: "+91 99999 00000",
        location: null,
        links: [
          { label: "Github", url: "github.com/srvjha" },
          { label: "Bad", url: "ht tp://nope" },
        ],
      },
      sections: [
        {
          type: "experience",
          title: "Experience",
          groups: [],
          links: [],
          entries: [
            entry({
              organization: "Bug0",
              role: "SWE",
              start: "Nov 2025",
              end: "Present",
              bullets: ["Built **agents**", "  "],
            }),
          ],
        },
        {
          type: "skills",
          title: "Skills",
          entries: [],
          links: [],
          groups: [
            { name: "Languages", items: ["TS", ""] },
            { name: "Empty", items: [] },
          ],
        },
      ],
    });

    expect(content.basics).toEqual({
      name: "Saurav Jha",
      phone: "+91 99999 00000",
      links: [{ label: "Github", url: "https://github.com/srvjha" }],
    });
    const [experience, skills] = content.sections;
    if (experience?.type !== "experience" || skills?.type !== "skills") throw new Error("unexpected");
    expect(experience.entries[0]).toMatchObject({
      organization: "Bug0",
      end: "present",
      bullets: [{ text: "Built **agents**" }],
    });
    expect(experience.entries[0]!.start).toBeUndefined();
    expect(skills.groups).toHaveLength(1);
    expect(skills.groups[0]!.items).toEqual(["TS"]);
    expect(new Set([experience.id, skills.id]).size).toBe(2);
  });
});

describe("normalizeExtraction limits", () => {
  it("moves a paragraph headline into a Summary section and cuts over-long fields", () => {
    const paragraph = "Analyst with five years in equity research. ".repeat(10);
    const content = normalizeExtraction({
      basics: { name: "A", headline: paragraph, email: null, phone: null, location: null, links: [] },
      sections: [
        {
          type: "skills",
          title: "Skills",
          text: null,
          entries: [],
          links: [],
          groups: [{ name: "Tools", items: ["x".repeat(100), ...Array.from({ length: 50 }, (_, i) => `s${i}`)] }],
        },
      ],
    });
    expect(content.basics.headline).toBeUndefined();
    const [summary, skills] = content.sections;
    expect(summary?.type === "summary" && summary.text).toBe(paragraph.trim());
    expect(skills?.type === "skills" && skills.groups[0]!.items).toHaveLength(40);
    expect(skills?.type === "skills" && skills.groups[0]!.items[0]).toHaveLength(60);
  });
});

describe("normalizeExtraction bullets", () => {
  it("drops the source's bullet symbols but keeps bold and leading numbers", () => {
    const content = normalizeExtraction({
      basics: { name: "A", headline: null, email: null, phone: null, location: null, links: [] },
      sections: [
        {
          type: "experience",
          title: "Experience",
          text: null,
          groups: [],
          links: [],
          entries: [
            entry({
              organization: "Ajar",
              bullets: ["• Fixed a leak", "- Audited auth", "• • Built a hub", "**Cut** builds", "-5% cost", "•"],
            }),
          ],
        },
      ],
    });
    const experience = content.sections[0];
    expect(experience?.type === "experience" && experience.entries[0]!.bullets.map((b) => b.text)).toEqual([
      "Fixed a leak",
      "Audited auth",
      "Built a hub",
      "**Cut** builds",
      "-5% cost",
    ]);
  });
});
