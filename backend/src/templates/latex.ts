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

// Escapes text and turns **bold** markers into \textbf{}.
export function texRich(value: string | undefined | null): string {
  return (value ?? "")
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => (index % 2 === 1 ? `\\textbf{${tex(part)}}` : tex(part)))
    .join("");
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
        if (section.type === "skills" || section.type === "links" || section.type === "summary") return section;
        const entries = section.entries
          .filter((entry) => !entry.hidden)
          .map((entry) => ({ ...entry, bullets: entry.bullets.filter((bullet) => !bullet.hidden) }));
        return { ...section, entries } as typeof section;
      }),
  };
}

// fontawesome5 has no X logo yet, so x.com links keep the bird.
const linkIcons: [RegExp, string][] = [
  [/linkedin/, "\\faLinkedin"],
  [/github/, "\\faGithub"],
  [/gitlab/, "\\faGitlab"],
  [/twitter|x\.com/, "\\faTwitter"],
  [/kaggle/, "\\faKaggle"],
  [/medium\.com/, "\\faMedium"],
  [/behance/, "\\faBehance"],
  [/dribbble/, "\\faDribbble"],
  [/stackoverflow/, "\\faStackOverflow"],
  [/youtube/, "\\faYoutube"],
  [/instagram/, "\\faInstagram"],
  [/leetcode|codeforces|codechef|hackerrank|geeksforgeeks/, "\\faCode"],
];

// Empty ActualText keeps the icon glyphs out of copied text and what an ATS reads.
const icon = (name: string) => `\\BeginAccSupp{ActualText={}}\\raisebox{-0.1\\height}{${name}}\\EndAccSupp{}\\,`;
const iconLink = (url: string, name: string, label: string) =>
  `\\href{${texUrl(url)}}{${icon(name)}\\underline{${tex(label)}}}`;

// Contact details with an icon each; email and links are underlined and clickable. Templates load fontawesome5
// and accsupp.
export function contactParts(basics: ResumeContent["basics"]) {
  return [
    basics.phone ? `${icon("\\faPhone")}${tex(basics.phone)}` : undefined,
    basics.email ? iconLink(`mailto:${basics.email}`, "\\faEnvelope", basics.email) : undefined,
    basics.location ? `${icon("\\faMapMarker")}${tex(basics.location)}` : undefined,
    ...basics.links.map((link) => {
      const target = `${link.label} ${link.url}`.toLowerCase();
      return iconLink(link.url, linkIcons.find(([pattern]) => pattern.test(target))?.[1] ?? "\\faGlobe", link.label);
    }),
  ].filter((part): part is string => Boolean(part));
}
