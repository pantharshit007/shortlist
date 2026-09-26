import type { ResumeContent } from "../schemas/resume-content.js";

const latexSpecials: Record<string, string> = {
  "\\": "\\textbackslash{}",
  "&": "\\&",
  "%": "\\%",
  $: "\\$",
  "#": "\\#",
  _: "\\_",
  "{": "\\{",
  "}": "\\}",
  "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}",
};

// All user text goes through this, so user input can never inject LaTeX commands.
export function tex(value: string | undefined | null): string {
  return (value ?? "").replace(/[\\&%$#_{}~^]/g, (char) => latexSpecials[char]!);
}

export function texUrl(url: string): string {
  return url.replace(/[\\%#{}]/g, (char) => `\\${char}`);
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(value: string | undefined) {
  if (!value) return "";
  if (value === "present") return "Present";
  const [year, month] = value.split("-");
  return month ? `${months[Number(month) - 1]} ${year}` : year!;
}

export function dateRange(start?: string, end?: string) {
  const from = formatDate(start);
  const to = formatDate(end);
  if (from && to) return `${from} -- ${to}`;
  return from || to;
}

export function joinNonEmpty(parts: (string | undefined)[], separator: string) {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(separator);
}

// Drops everything the user hid, so templates only deal with what is shown.
export function visibleContent(content: ResumeContent): ResumeContent {
  return {
    basics: content.basics,
    sections: content.sections
      .filter((section) => !section.hidden)
      .map((section) => {
        if (section.type === "skills") return section;
        const entries = section.entries
          .filter((entry) => !entry.hidden)
          .map((entry) => ({ ...entry, bullets: entry.bullets.filter((bullet) => !bullet.hidden) }));
        return { ...section, entries } as typeof section;
      }),
  };
}

export function contactParts(basics: ResumeContent["basics"]) {
  return [
    basics.phone ? tex(basics.phone) : undefined,
    basics.email ? `\\href{mailto:${texUrl(basics.email)}}{${tex(basics.email)}}` : undefined,
    basics.location ? tex(basics.location) : undefined,
    ...basics.links.map((link) => `\\href{${texUrl(link.url)}}{${tex(link.label)}}`),
  ].filter((part): part is string => Boolean(part));
}
