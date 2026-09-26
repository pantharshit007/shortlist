import type { ResumeContent } from "../../schemas/resume-content.js";
import { visibleContent } from "../../templates/latex.js";

export type RequirementStatus = "covered" | "in_profile" | "missing";

const normalize = (value: string) =>
  ` ${value
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/[^a-z0-9.+#/ ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

// Whole-word match so "Go" doesn't match "Google" but "Node.js" still matches "node.js".
function mentions(haystack: string, term: string) {
  const needle = normalize(term).trim();
  return needle.length > 0 && haystack.includes(` ${needle} `);
}

function sectionTexts(content: ResumeContent) {
  return content.sections.map((section) => ({ title: section.title, text: normalize(JSON.stringify(section)) }));
}

export function coverageReport(
  requirements: { mustHave: string[]; niceToHave: string[]; keywords: string[] },
  resume: { content: ResumeContent | null; texSource: string | null },
  profile: ResumeContent,
) {
  const sections = resume.content
    ? sectionTexts(visibleContent(resume.content))
    : [{ title: "LaTeX source", text: normalize(resume.texSource ?? "") }];
  const basics = resume.content ? normalize(JSON.stringify(resume.content.basics)) : "";
  const profileText = normalize(JSON.stringify(profile));

  const check = (term: string) => {
    const foundIn = sections.filter((s) => mentions(s.text, term)).map((s) => s.title);
    const status: RequirementStatus =
      foundIn.length > 0 || mentions(basics, term) ? "covered" : mentions(profileText, term) ? "in_profile" : "missing";
    return { requirement: term, status, foundIn };
  };

  const unique = (items: string[]) => [...new Set(items.map((i) => i.trim()).filter(Boolean))];
  const mustHave = unique(requirements.mustHave).map(check);
  const niceToHave = unique(requirements.niceToHave).map(check);
  const keywords = unique(requirements.keywords).map(check);

  const counted = [...mustHave, ...niceToHave];
  return {
    covered: counted.filter((r) => r.status === "covered").length,
    total: counted.length,
    mustHave,
    niceToHave,
    keywords,
  };
}
