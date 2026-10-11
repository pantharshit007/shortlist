import { linkParts } from "../schemas/rich-text.js";
import type { ResumeContent } from "../schemas/resume-content.js";
import type { ResumeLayout } from "./layout.js";

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

const texBold = (value: string) =>
  value
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => (index % 2 === 1 ? `\\textbf{${tex(part)}}` : tex(part)))
    .join("");

// Escapes text, turns **bold** markers into \textbf{} and [words](url) into an underlined link on those words.
export function texRich(value: string | undefined | null): string {
  return linkParts(value ?? "")
    .map((part) =>
      "url" in part ? `\\href{${texUrl(part.url)}}{\\underline{${texBold(part.text)}}}` : texBold(part.text),
    )
    .join("");
}

// TeX reads ^^5c as a backslash, so ^ is percent-encoded first (same meaning in a URL). & is escaped because
// an unescaped one inside a table (project headings) is read as a column break.
export function texUrl(url: string): string {
  return url.replace(/\^/g, "%5E").replace(/[\\%#{}&]/g, (char) => `\\${char}`);
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
      // A skills section added a moment ago has one empty group, and an itemize with nothing in it doesn't compile.
      .filter(
        (section) => !section.hidden && (section.type !== "skills" || section.groups.some((g) => g.items.length > 0)),
      )
      .map((section) => {
        // Templates print "Group: items", so a name typed as "Frontend:" would show two colons.
        if (section.type === "skills")
          return {
            ...section,
            groups: section.groups
              .filter((g) => g.items.length > 0)
              .map((g) => ({ ...g, name: g.name.replace(/\s*:+$/, "") })),
          };
        if (section.type === "links" || section.type === "summary") return section;
        const entries = section.entries
          .filter((entry) => !entry.hidden)
          .map((entry) => ({ ...entry, bullets: entry.bullets.filter((bullet) => !bullet.hidden) }));
        return { ...section, entries } as typeof section;
      }),
  };
}

// A project heading is one unwrapped line; past this many characters it runs off the page, so the tech list moves
// to its own line under the heading. A date on the right takes room; without one, about 90 fit even at 12pt.
// ponytail: counts characters, not rendered width; a font-aware measure would be exact.
export const fitsOneLine = (parts: (string | undefined)[], dated: boolean) =>
  parts.filter(Boolean).join(" | ").length <= (dated ? 75 : 90);

type ListEntry = Extract<ResumeContent["sections"][number], { type: "list" }>["entries"][number];

// The extra space a user asked for after an entry; nothing when unset, so other resumes render unchanged.
export const gap = (e: { spaceAfter?: number | undefined }) => (e.spaceAfter ? `\n\\vspace{${e.spaceAfter}pt}` : "");

// A rendered section followed by the space the user asked for; empty sections stay empty.
// Space after a section's closing list is merged with the list's own end spacing and the next heading's, so LaTeX
// added about 10pt more than asked and ignored tightening. Just inside the list, before it closes, it's exact.
const closingList = /\\(?:end\{(?:itemize|enumerate|description)\}|[A-Za-z]*ListEnd)(?:\\vspace\{[^}]*\})?\s*$/;
export const withGap = (rendered: string, s: { spaceAfter?: number | undefined }) => {
  if (!rendered || !s.spaceAfter) return rendered;
  const end = closingList.exec(rendered);
  return end
    ? `${rendered.slice(0, end.index)}\\vspace{${s.spaceAfter}pt}\n${rendered.slice(end.index)}`
    : rendered + gap(s);
};

// Achievements and certifications without bullets of their own read best as one tight bulleted list:
// "Name, a dash, description" with the name bold (and linked), or the item as plain text when it is one sentence.
export function compactList(entries: ListEntry[]) {
  const items = entries.map((e) => {
    // A linked name is bold and underlined like other links; a linked sentence gets a link icon.
    const title = !e.url
      ? e.subtitle
        ? `\\textbf{${texRich(e.title)}}`
        : texRich(e.title)
      : e.subtitle
        ? `\\href{${texUrl(e.url)}}{\\underline{\\textbf{${texRich(e.title)}}}}`
        : `${texRich(e.title)}\\,\\href{${texUrl(e.url)}}{${icon("\\faLink")}}`;
    const subtitle = e.subtitle ? ` -- ${texRich(e.subtitle)}` : "";
    const date = e.date ? ` (${tex(e.date)})` : "";
    return `  \\item \\small{${title}${subtitle}${date}}${gap(e)}`;
  });
  return `\\begin{itemize}[leftmargin=0.15in, itemsep=1pt, parsep=0pt, topsep=2pt]\n${items.join("\n")}\n\\end{itemize}`;
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

// A link as it reads on the page: "linkedin.com/in/aarav", not "https://www.linkedin.com/in/aarav/".
export const displayUrl = (url: string) =>
  url
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "");

// Contact details with an icon each; email and links are underlined and clickable. Templates load fontawesome5
// and accsupp. Links show their address, not a label like "LinkedIn": an ATS keeps only the visible text, so a
// label alone leaves the recruiter without the address.
// "icon-and-name" shows a profile link as its icon and name ("LinkedIn"), so an ATS and a printed copy lose the
// address (the editor says so); "link" drops every icon. Email and phone always stay readable.
export function contactParts(basics: ResumeContent["basics"], links?: ResumeLayout["links"]) {
  const mark = (name: string) => (links === "link" ? "" : icon(name));
  return (
    [
      basics.phone ? `${mark("\\faPhone")}${tex(basics.phone)}` : undefined,
      basics.email
        ? links === "link"
          ? `\\href{${texUrl(`mailto:${basics.email}`)}}{\\underline{${tex(basics.email)}}}`
          : iconLink(`mailto:${basics.email}`, "\\faEnvelope", basics.email)
        : undefined,
      basics.location ? `${mark("\\faMapMarker")}${tex(basics.location)}` : undefined,
      ...basics.links.map((link) => {
        const target = `${link.label} ${link.url}`.toLowerCase();
        const name = linkIcons.find(([pattern]) => pattern.test(target))?.[1] ?? "\\faGlobe";
        const address = displayUrl(link.url);
        if (links === "icon-and-name") return iconLink(link.url, name, link.label.trim() || address);
        if (links === "link") return `\\href{${texUrl(link.url)}}{\\underline{${tex(address)}}}`;
        return iconLink(link.url, name, address);
      }),
    ]
      .filter((part): part is string => Boolean(part))
      // A long contact line wraps between items (templates join them with spacing that can't break on its
      // own), never inside a phone number or address.
      .map((part) => `\\allowbreak\\mbox{${part}}`)
  );
}
