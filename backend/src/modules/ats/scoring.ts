import type { z } from "zod";
import { compileTex } from "../../lib/latex/compile.js";
import type { ResumeContent } from "../../schemas/resume-content.js";
import { visibleContent } from "../../templates/latex.js";
import type { atsReport } from "./ats.schemas.js";
import { findKnockouts } from "./knockouts.js";
import { extractTextItems } from "./parser/extract.js";
import { parseItems } from "./parser/parse.js";
import { type Expected, parseQuality } from "./parser/quality.js";
import type { ParseReport, TextItem } from "./parser/types.js";
import { matchJob, titleMatch } from "./skills/match.js";
import { ACTION_VERBS, CLICHES, IRREGULAR_VERBS, SECTION_HEADINGS } from "./words.js";

type AtsReport = z.infer<typeof atsReport>;
type Status = "pass" | "warn" | "fail";
type Check = { id: string; label: string; status: Status; detail: string; fix: string | null; weight: number };

type Facts = {
  text: string;
  structured: boolean;
  words: number;
  bullets: string[];
  sections: string[];
  oddHeadings: string[];
  paragraphs: number;
  // Headline and role lines, for matching the job's title.
  titles: string[];
  skillsText: string;
  // Known only for structured content.
  experienceEntries: number | null;
  undatedEntries: number;
  contact: { email: boolean; phone: boolean; location: boolean; linkedin: boolean; otherLink: boolean };
};

const WEIGHTS = {
  withoutJob: { parsing: 20, contact: 15, sections: 15, impact: 35, length: 15, job: 0 },
  withJob: { parsing: 15, contact: 10, sections: 15, impact: 25, length: 10, job: 25 },
};

const BULLET =
  /^\s*(?:[\u2022\u00b7\u25aa\u25cf\u25e6\u2023\u2219\u25cb\u25a0\u25a1\u25ba\u25b8\u27a2\u27a4\u2713\u2714]\s*|[*\u2013-]\s+)/u;
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const YEAR = /\b(?:19|20)\d{2}\b/g;
const PROSE_SECTIONS = new Set(["summary", "experience", "projects", "leadership"]);

const countWords = (text: string) => text.match(/[\p{L}\p{N}][\p{L}\p{N}'.+#-]*/gu)?.length ?? 0;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const quote = (text: string) => `"${text.length > 70 ? `${text.slice(0, 67).trimEnd()}...` : text}"`;
const share = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);

function headingId(line: string) {
  const key = line
    .toLowerCase()
    .replace(/[^a-z& ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!key || line.length > 40 || key.split(" ").length > 5) return null;
  return SECTION_HEADINGS.find((heading) => heading.pattern.test(key))?.id ?? null;
}

// Plain text of a LaTeX source, close to what a parser pulls out of the compiled PDF.
export function texToText(source: string) {
  const body = /\\begin\{document\}([\s\S]*?)\\end\{document\}/.exec(source)?.[1] ?? source;
  return body
    .replace(/(^|[^\\])%.*$/gm, "$1")
    .replace(/\\href\{(?:mailto:)?([^{}]*)\}/g, "$1 ")
    .replace(/\\url\{([^{}]*)\}/g, "$1")
    .replace(/\\(?:sub)*section\*?\{([^{}]*)\}/g, "\n$1\n")
    .replace(/\\\w*[Ii]tem(?![A-Za-z])/g, "\n\u2022 ")
    .replace(/\\\\(?:\[[^\]]*\])?/g, "\n")
    .replace(/\\(?:begin|end)\{[^{}]*\}(?:\{[^{}]*\}|\[[^\]]*\])*/g, "\n")
    .replace(
      /\\(?:vspace|hspace|vskip|hskip|setlength|addtolength|titleformat|definecolor|fontsize|includegraphics|rule|label|pagestyle|newcommand|renewcommand|input|usepackage)\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})*/g,
      "",
    )
    .replace(/\}\s*\{/g, " | ")
    .replace(/(?<!\\)[&~$]/g, " ")
    .replace(/\\[A-Za-z]+\*?(?:\[[^\]]*\])?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\\([%&$#_])/g, "$1")
    .replace(/-{2,}/g, "-")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\u2022\s+/g, "\u2022 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function contactFromText(text: string, header: string) {
  const withoutEmails = text.replace(EMAIL, " ");
  const phones = withoutEmails.match(/\+?\d[\d\s().-]{6,}\d/g) ?? [];
  return {
    email: withoutEmails !== text,
    // 10 to 15 digits, or a "+" country code, so "2019 - 2023" isn't read as a phone number.
    phone: phones.some((p) => {
      const digits = p.replace(/\D/g, "").length;
      return digits <= 15 && (digits >= 10 || (p.startsWith("+") && digits >= 8));
    }),
    location: /\p{Lu}[\p{L}.]+(?: \p{Lu}[\p{L}.]+)*, \p{Lu}\p{L}+|\b(?:India|Remote)\b/u.test(header),
    linkedin: /linkedin\.com\/in\//i.test(text),
    otherLink:
      /(?:github\.com|gitlab\.com|bitbucket\.org|behance\.net|dribbble\.com|kaggle\.com|leetcode\.com|codeforces\.com|https?:\/\/(?!(?:www\.)?linkedin)\S+|\b[\w-]+\.(?:dev|io|me|app|tech|site|xyz)\b)/i.test(
        withoutEmails,
      ),
  };
}

function factsFromText(raw: string): Facts {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  type Line = { text: string; section: string | null; kind: "plain" | "bullet" | "break" };
  const parsed: Line[] = [];
  const sections: string[] = [];
  const oddHeadings: string[] = [];
  let section: string | null = null;
  let seen = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      parsed.push({ text: "", section, kind: "break" });
      continue;
    }
    seen++;
    const id = headingId(line);
    if (id) {
      section = id;
      if (!sections.includes(id)) sections.push(id);
      parsed.push({ text: "", section, kind: "break" });
    } else if (BULLET.test(line)) {
      const listed = section === "skills" || section === "coursework" || section === "links";
      parsed.push({ text: line.replace(BULLET, ""), section, kind: listed ? "plain" : "bullet" });
    } else if (/^\p{Ll}/u.test(line) && parsed.at(-1)?.kind === "bullet") {
      // ponytail: a wrapped bullet is joined only when the next line starts lowercase.
      parsed.at(-1)!.text += ` ${line}`;
    } else if (seen > 3 && /^\p{Lu}[\p{Lu} &/]{2,30}$/u.test(line) && line.split(" ").length <= 3) {
      oddHeadings.push(line);
      section = null;
      parsed.push({ text: "", section, kind: "break" });
    } else {
      parsed.push({ text: line, section, kind: "plain" });
    }
  }

  // Some PDFs drop the bullet glyphs; then sentence-length lines under experience or projects are the bullets.
  if (!parsed.some((line) => line.kind === "bullet")) {
    for (const line of parsed) {
      if (line.kind === "plain" && line.section && PROSE_SECTIONS.has(line.section) && countWords(line.text) >= 6)
        line.kind = "bullet";
    }
  }

  let paragraphs = 0;
  let block = 0;
  for (const line of [...parsed, { text: "", section: null, kind: "break" as const }]) {
    if (line.kind === "plain" && (!line.section || PROSE_SECTIONS.has(line.section))) {
      block += countWords(line.text);
      continue;
    }
    if (block > 60) paragraphs++;
    block = 0;
  }

  const text = raw.trim();
  const headerLines = lines.filter((line) => line.trim()).slice(0, 6);
  const header = headerLines.join("\n");
  const plainIn = (id: string) => parsed.filter((line) => line.kind === "plain" && line.section === id);
  return {
    text,
    structured: false,
    words: countWords(text),
    bullets: parsed.filter((line) => line.kind === "bullet").map((line) => line.text),
    sections,
    oddHeadings,
    paragraphs,
    titles: [
      ...headerLines,
      ...plainIn("experience")
        .map((line) => line.text)
        .filter((line) => countWords(line) <= 12),
    ],
    skillsText: plainIn("skills")
      .map((line) => line.text)
      .join("\n"),
    experienceEntries: null,
    undatedEntries: 0,
    contact: contactFromText(text, header),
  };
}

function factsFromContent(full: ResumeContent): Facts {
  const content = visibleContent(full);
  const strip = (value: string) => value.replace(/\*\*/g, "");
  const join = (parts: (string | undefined)[]) => parts.filter(Boolean).join(" | ");
  const lines: string[] = [
    content.basics.name,
    content.basics.headline ?? "",
    join([content.basics.email, content.basics.phone, content.basics.location]),
    ...content.basics.links.map((link) => `${link.label} ${link.url}`),
  ];
  const bullets: string[] = [];
  const sections: string[] = [];
  const oddHeadings: string[] = [];
  const urls = content.basics.links.map((link) => link.url);
  const titles = content.basics.headline ? [content.basics.headline] : [];
  const skills: string[] = [];
  let experienceEntries = 0;
  let undatedEntries = 0;

  for (const section of content.sections) {
    lines.push("", section.title);
    const id = headingId(section.title);
    const typed = section.type !== "list" && section.type !== "links";
    if (typed && id !== section.type) oddHeadings.push(section.title);
    const canonical = typed ? section.type : id;
    if (canonical && !sections.includes(canonical)) sections.push(canonical);

    if (section.type === "skills") {
      const groups = section.groups.map((group) => `${group.name}: ${group.items.join(", ")}`);
      skills.push(...groups);
      lines.push(...groups);
      continue;
    }
    if (section.type === "links") {
      lines.push(...section.links.map((link) => `${link.label} ${link.url}`));
      urls.push(...section.links.map((link) => link.url));
      continue;
    }
    const headers =
      section.type === "experience"
        ? section.entries.map((entry) => {
            experienceEntries++;
            titles.push(entry.role);
            if (!entry.start) undatedEntries++;
            return join([entry.role, entry.organization, entry.location, entry.start, entry.end]);
          })
        : section.type === "education"
          ? section.entries.map((entry) =>
              join([entry.institution, entry.degree, entry.field, entry.score, entry.start, entry.end]),
            )
          : section.type === "projects"
            ? section.entries.map((entry) => {
                urls.push(...(entry.url ? [entry.url] : []), ...entry.links.map((link) => link.url));
                return join([entry.name, entry.technologies.join(", "), entry.url]);
              })
            : section.entries.map((entry) => join([entry.title, entry.subtitle, entry.date, entry.url]));
    const entries: { bullets: { text: string }[] }[] = section.entries;
    entries.forEach((entry, index) => {
      lines.push(headers[index]!);
      for (const bullet of entry.bullets) {
        bullets.push(strip(bullet.text));
        lines.push(`\u2022 ${strip(bullet.text)}`);
      }
    });
  }

  const text = lines.join("\n").trim();
  const isLinkedIn = (url: string) => /(^|\.)linkedin\.com$/i.test(URL.parse(url)?.hostname ?? "");
  return {
    text,
    structured: true,
    words: countWords(text),
    bullets,
    sections,
    oddHeadings,
    paragraphs: bullets.filter((bullet) => countWords(bullet) > 60).length,
    titles,
    skillsText: skills.join("\n"),
    experienceEntries,
    undatedEntries,
    contact: {
      email: Boolean(content.basics.email),
      phone: Boolean(content.basics.phone),
      location: Boolean(content.basics.location),
      linkedin: urls.some(isLinkedIn),
      otherLink: urls.some((url) => !isLinkedIn(url)),
    },
  };
}

const check = (id: string, label: string, weight: number, status: Status, detail: string, fix: string): Check => ({
  id,
  label,
  weight,
  status,
  detail,
  fix: status === "pass" ? null : fix,
});

const band = (value: number, pass: number, warn: number): Status =>
  value >= pass ? "pass" : value >= warn ? "warn" : "fail";

function parsingChecks(facts: Facts): Check[] {
  const unreadable = facts.text.match(/[\uFFFD\uE000-\uF8FF]/gu)?.length ?? 0;
  const icons =
    facts.text
      .split("\n")
      .map((line) => line.replace(BULLET, ""))
      .join("\n")
      .match(/\p{Extended_Pictographic}/gu)?.length ?? 0;
  const years = facts.text.match(YEAR)?.length ?? 0;

  return [
    facts.structured
      ? check("readable", "Readable text", 3, "pass", "Built from structured fields, so the text layer is clean.", "")
      : check(
          "readable",
          "Readable text",
          3,
          band(facts.words, 100, 50),
          `${plural(facts.words, "word")} came through as text.`,
          "Most of this resume didn't come through as text. Export a text PDF from your editor (not a scan or a photo), and keep text out of images.",
        ),
    check(
      "characters",
      "Standard characters",
      2,
      unreadable === 0 ? "pass" : unreadable <= 5 ? "warn" : "fail",
      unreadable === 0
        ? "No unreadable characters found."
        : `${plural(unreadable, "character")} can't be read, usually from icon fonts or unusual symbols.`,
      'Replace icon fonts and special symbols (for phone, email, or skill ratings) with plain words like "Phone:" or the value itself.',
    ),
    check(
      "icons",
      "No emoji or icons",
      1,
      icons <= 2 ? "pass" : "warn",
      icons === 0 ? "No emoji or pictographs." : `${plural(icons, "emoji or icon")} found.`,
      "Remove emoji and pictographs. Parsers drop them or turn them into junk characters.",
    ),
    facts.structured
      ? check(
          "dates",
          "Dates on roles",
          2,
          facts.undatedEntries === 0 ? "pass" : "warn",
          facts.undatedEntries === 0
            ? "Every role has a start date."
            : `${plural(facts.undatedEntries, "role")} without a start date.`,
          "Add start and end dates to every role. An ATS uses them to work out your years of experience.",
        )
      : check(
          "dates",
          "Dates on roles",
          2,
          years > 0 ? "pass" : "fail",
          years > 0 ? `${plural(years, "year")} found in dates.` : "No years found anywhere in the resume.",
          'Add month and year to every role and degree, for example "Jun 2023 - Present".',
        ),
  ];
}

const PARSE_WEIGHTS: Record<string, number> = {
  columns: 3,
  density: 3,
  glyphs: 2,
  contact: 2,
  sections: 2,
  jobs: 2,
  name: 2,
};

// What a parser read from the PDF replaces the text-based guesses about format.
function parserChecks(facts: Facts, parse: ParseReport): Check[] {
  const checks = parse.issues
    // A missing email or phone already fails in Contact details; here it only counts when the PDF hides it.
    .filter((issue) => issue.id !== "contact" || (facts.contact.email && facts.contact.phone))
    .map((issue) => ({ ...issue, weight: PARSE_WEIGHTS[issue.id] ?? 1 }));
  if (parse.parseRate === null) return checks;
  const missed = parse.fields.filter((field) => !field.ok);
  return [
    check(
      "parse-rate",
      "Parse rate",
      4,
      band(parse.parseRate, 0.9, 0.7),
      `A parser read ${parse.fields.length - missed.length} of ${parse.fields.length} fields correctly.`,
      `It missed or misread: ${missed.map((field) => field.label).join(", ")}. Keep one column, plain headings, and each job's title, company and dates on its own lines.`,
    ),
    ...checks,
  ];
}

function contactChecks(facts: Facts): Check[] {
  const { email, phone, location, linkedin, otherLink } = facts.contact;
  const labelOnly = !facts.structured && !linkedin && /\blinked\s?in\b/i.test(facts.text);
  return [
    check(
      "email",
      "Email",
      3,
      email ? "pass" : "fail",
      email ? "Email address found." : "No email address found.",
      "Add your email at the top, as plain text in the body (not in a header or footer, which some parsers skip).",
    ),
    check(
      "phone",
      "Phone",
      2,
      phone ? "pass" : "fail",
      phone ? "Phone number found." : "No phone number found.",
      "Add a phone number with your country code, for example +91 98765 43210.",
    ),
    check(
      "location",
      "Location",
      1,
      location ? "pass" : "warn",
      location ? "Location found." : "No city found near your name.",
      'Add your city and country, like "Bengaluru, India". Recruiters filter by location, and "Remote" works too.',
    ),
    check(
      "linkedin",
      "LinkedIn",
      2,
      linkedin ? "pass" : "warn",
      linkedin
        ? "LinkedIn profile link found."
        : labelOnly
          ? '"LinkedIn" appears as a label, but the address isn\'t in the text.'
          : "No LinkedIn profile link found.",
      labelOnly
        ? "Write the link out as linkedin.com/in/your-name, since a parser may read only the visible text."
        : "Add your LinkedIn profile link, like linkedin.com/in/your-name.",
    ),
    check(
      "links",
      "GitHub or portfolio",
      1,
      otherLink ? "pass" : "warn",
      otherLink ? "GitHub, portfolio or other profile link found." : "No GitHub or portfolio link found.",
      "Add a GitHub, portfolio or coding profile link so reviewers can see your work.",
    ),
  ];
}

const isEarlyCareer = (facts: Facts) =>
  facts.experienceEntries !== null ? facts.experienceEntries <= 1 : !facts.sections.includes("experience");

function sectionChecks(facts: Facts): Check[] {
  const has = (id: string) => facts.sections.includes(id);
  const early = isEarlyCareer(facts);
  return [
    check(
      "experience",
      "Experience",
      3,
      has("experience") ? "pass" : has("projects") ? "warn" : "fail",
      has("experience") ? "Experience section found." : "No Experience section found.",
      'Add an Experience section headed "Experience". Internships, freelance work and open source contributions all count.',
    ),
    check(
      "education",
      "Education",
      3,
      has("education") ? "pass" : "fail",
      has("education") ? "Education section found." : "No Education section found.",
      "Add an Education section with your degree, college, years and CGPA or percentage.",
    ),
    check(
      "skills",
      "Skills",
      3,
      has("skills") ? "pass" : "fail",
      has("skills") ? "Skills section found." : "No Skills section found.",
      'Add a Skills section headed "Skills", grouped like Languages, Frameworks, Tools. Recruiters search an ATS by skill first.',
    ),
    check(
      "projects",
      "Projects",
      2,
      has("projects") || !early ? "pass" : "fail",
      has("projects")
        ? "Projects section found."
        : early
          ? "No Projects section, and little work experience to stand in for it."
          : "No Projects section; optional once you have work experience.",
      "Add a Projects section with 2 or 3 projects, the stack you used, and a link to each.",
    ),
    check(
      "headings",
      "Standard headings",
      2,
      facts.oddHeadings.length === 0 && facts.sections.length > 0 ? "pass" : "warn",
      facts.sections.length === 0
        ? "No standard section headings found."
        : facts.oddHeadings.length === 0
          ? `Found ${plural(facts.sections.length, "standard heading")}.`
          : `${plural(facts.oddHeadings.length, "heading")} a parser may not recognise: ${facts.oddHeadings
              .slice(0, 3)
              .map(quote)
              .join(", ")}.`,
      "Rename headings to the standard ones: Experience, Education, Skills, Projects, Achievements.",
    ),
  ];
}

function startsWithActionVerb(bullet: string) {
  const word = (bullet.replace(/^[^\p{L}]+/u, "").split(/[^\p{L}]/u)[0] ?? "").toLowerCase();
  if (ACTION_VERBS.has(word) || IRREGULAR_VERBS.has(word) || /^[a-z]{3,}ed$/.test(word)) return true;
  return (
    ["s", "es", "d", "ing"].some(
      (suffix) => word.endsWith(suffix) && ACTION_VERBS.has(word.slice(0, -suffix.length)),
    ) ||
    (word.endsWith("ing") && ACTION_VERBS.has(`${word.slice(0, -3)}e`))
  );
}

// A digit or % that isn't just a year, e.g. "cut load time by 40%" or "served 2k users".
const isQuantified = (bullet: string) => /[\d%]/.test(bullet.replace(YEAR, ""));

function impactChecks(facts: Facts): Check[] {
  const { bullets } = facts;
  const total = bullets.length;
  const weakVerb = bullets.filter((bullet) => !startsWithActionVerb(bullet));
  const unquantified = bullets.filter((bullet) => !isQuantified(bullet));
  const long = bullets.filter((bullet) => countWords(bullet) > 35);
  const short = bullets.filter((bullet) => countWords(bullet) < 5);
  const firstPerson =
    (facts.text.match(/\bI(?:'m|'ve|'d)?(?![\w/.])/g)?.length ?? 0) +
    (facts.text.match(/\b(?:me|my|myself)\b/gi)?.length ?? 0);
  const normalized = ` ${facts.text.toLowerCase().replace(/[^a-z]+/g, " ")} `;
  const cliches = CLICHES.filter((phrase) => normalized.includes(` ${phrase} `));
  // Shares are taken over at least 6 bullets, so 2 good bullets don't count as a full resume of them.
  const verbShare = share(total - weakVerb.length, Math.max(total, 6));
  const numberShare = share(total - unquantified.length, Math.max(total, 6));
  const badLength = share(long.length + short.length, total);

  return [
    check(
      "bullet-count",
      "Bullet points",
      4,
      band(total, 6, 3),
      `${plural(total, "bullet point")} found.`,
      "Describe each role and project in 2 to 4 bullet points instead of paragraphs, so a recruiter can skim them.",
    ),
    check(
      "action-verbs",
      "Action verbs",
      3,
      total === 0 ? "fail" : band(verbShare, 0.7, 0.4),
      `${total - weakVerb.length} of ${total} bullets start with an action verb.`,
      weakVerb.length > 0
        ? `Start each bullet with a strong verb like Built, Led, Reduced or Shipped. For example, rewrite ${quote(weakVerb[0]!)}.`
        : "Start each bullet with a strong verb like Built, Led, Reduced or Shipped.",
    ),
    check(
      "quantified",
      "Quantified results",
      4,
      total === 0 ? "fail" : band(numberShare, 0.5, 0.25),
      `${total - unquantified.length} of ${total} bullets have a number.`,
      unquantified.length > 0
        ? `Add a number to show scale or results (users, %, time saved, rank). For example, ${quote(unquantified[0]!)}: how many, how fast, how much?`
        : "Add a number to show scale or results (users, %, time saved, rank).",
    ),
    check(
      "bullet-length",
      "Bullet length",
      2,
      total === 0 ? "warn" : badLength <= 0.2 ? "pass" : badLength <= 0.4 ? "warn" : "fail",
      `${plural(long.length, "bullet")} over 35 words, ${short.length} under 5 words.`,
      long[0]
        ? `Keep bullets to one or two lines. Split or trim ${quote(long[0])}.`
        : short[0]
          ? `Give short bullets the what, how and result. For example, expand ${quote(short[0])}.`
          : "Write bullets of one or two lines: what you did, how, and the result.",
    ),
    check(
      "first-person",
      "No first person",
      2,
      firstPerson === 0 ? "pass" : firstPerson <= 2 ? "warn" : "fail",
      firstPerson === 0 ? 'No "I", "me" or "my" found.' : `"I", "me" or "my" used ${plural(firstPerson, "time")}.`,
      'Drop "I", "me" and "my": write "Built X" rather than "I built X".',
    ),
    check(
      "paragraphs",
      "No long paragraphs",
      2,
      facts.paragraphs === 0 ? "pass" : facts.paragraphs === 1 ? "warn" : "fail",
      facts.paragraphs === 0
        ? "No blocks of text over 60 words."
        : `${plural(facts.paragraphs, "block")} of text over 60 words.`,
      "Break long paragraphs into short bullet points. Recruiters skim, and parsers handle bullets better.",
    ),
    check(
      "cliches",
      "No filler phrases",
      1,
      cliches.length === 0 ? "pass" : cliches.length <= 2 ? "warn" : "fail",
      cliches.length === 0
        ? "No filler phrases found."
        : `Filler phrases found: ${cliches.map((phrase) => `"${phrase}"`).join(", ")}.`,
      'Replace filler like "team player" or "responsible for" with what you did and what changed because of it.',
    ),
  ];
}

function lengthChecks(facts: Facts): Check[] {
  const { words } = facts;
  const early = isEarlyCareer(facts);
  const pages = Math.max(1, Math.round(words / 550));
  const status: Status =
    words < 150 || words > 1200 ? "fail" : words < 300 || words > 900 || (early && words > 750) ? "warn" : "pass";
  const fix =
    words < 300
      ? "Add detail: 2 to 4 bullets per role and project, and your key skills. Aim for 400 to 700 words."
      : early
        ? "Trim to one page (about 400 to 700 words). Cut older or weaker bullets first."
        : "Trim to two pages at most (under 900 words). Cut bullets older roles don't need.";
  return [check("word-count", "Length", 1, status, `${plural(words, "word")}, about ${plural(pages, "page")}.`, fix)];
}

const list = (skills: string[], max = 6) => skills.slice(0, max).join(", ");

function jobMatch(facts: Facts, jobText: string) {
  const { hard, soft, mustHave } = matchJob(facts.text, jobText, { skillsSection: facts.skillsText });
  const isMust = (skill: string) => mustHave.includes(skill);
  const mustHard = [...hard.matched, ...hard.missing].filter(isMust);
  const mustMissing = hard.missing.filter(isMust);
  const other = { matched: hard.matched.filter((s) => !isMust(s)), missing: hard.missing.filter((s) => !isMust(s)) };
  const otherTotal = other.matched.length + other.missing.length;
  const softTotal = soft.matched.length + soft.missing.length;
  const checks: Check[] = [];

  if (mustHard.length > 0)
    checks.push(
      check(
        "must-have",
        "Must-have skills",
        4,
        mustMissing.length === 0 ? "pass" : "fail",
        mustMissing.length === 0
          ? `All ${plural(mustHard.length, "must-have skill")} found.`
          : `Missing ${mustMissing.length} of ${plural(mustHard.length, "must-have skill")}: ${list(mustMissing, 10)}.`,
        `Add the must-haves you really have to Skills and to the bullets where you used them: ${list(mustMissing, 10)}.`,
      ),
    );
  if (otherTotal > 0)
    checks.push(
      check(
        "hard-skills",
        "Other hard skills",
        3,
        band(share(other.matched.length, otherTotal), 0.75, 0.5),
        `${other.matched.length} of ${plural(otherTotal, "other hard skill")} in the job found.`,
        `Add the ones you really have, in Skills and in your bullets: ${list(other.missing)}.`,
      ),
    );
  if (softTotal > 0)
    checks.push(
      check(
        "soft-skills",
        "Soft skills",
        1,
        share(soft.matched.length, softTotal) >= 0.5 ? "pass" : "warn",
        `${soft.matched.length} of ${plural(softTotal, "soft skill")} in the job found.`,
        `Show these through what you did rather than listing them: ${list(soft.missing)}.`,
      ),
    );

  const found = titleMatch(facts.titles, jobText);
  const title = found.jobTitle ? { jobTitle: found.jobTitle, best: found.best, level: found.level } : null;
  if (title)
    checks.push(
      check(
        "job-title",
        "Job title",
        2,
        title.level === "exact" ? "pass" : title.level === "close" ? "warn" : "fail",
        title.level === "exact"
          ? `Your resume uses the job's title, "${title.jobTitle}".`
          : title.level === "close"
            ? `Closest on your resume: "${title.best}", a close match for "${title.jobTitle}".`
            : `The job's title, "${title.jobTitle}", isn't on your resume.`,
        `Use the job's title, ${title.jobTitle}, in your headline if it's true for you.`,
      ),
    );

  return {
    checks,
    hasSkills: hard.matched.length + hard.missing.length + softTotal > 0,
    keywords: { matched: hard.matched, missing: hard.missing, hard, soft, mustHaveMissing: mustMissing },
    title,
  };
}

const STATUS_VALUE: Record<Status, number> = { pass: 1, warn: 0.5, fail: 0 };

const GRADES = [
  { min: 85, grade: "excellent", text: "Excellent: a typical ATS and recruiter scan will read this resume well." },
  { min: 70, grade: "good", text: "Good: most ATS will read this resume, with a few gaps to close." },
  { min: 50, grade: "fair", text: "Fair: an ATS can read parts of this, but key details are weak or missing." },
  { min: 0, grade: "poor", text: "Poor: an ATS and a recruiter will likely miss important details." },
] as const;

export function scoreResume(input: {
  text?: string | null;
  content?: ResumeContent | null;
  jobText?: string | null | undefined;
  // What a parser read from the resume's PDF; text-based format checks are used without it.
  parse?: ParseReport | null;
}): AtsReport {
  const facts = input.content ? factsFromContent(input.content) : factsFromText(input.text ?? "");
  const { parse } = input;
  const match = input.jobText ? jobMatch(facts, input.jobText) : null;
  // A job with no skills found is scored as if there were none, so it can't drag the score down.
  const hasJob = Boolean(match?.hasSkills);
  const weights = hasJob ? WEIGHTS.withJob : WEIGHTS.withoutJob;

  const groups = [
    { id: "parsing", label: "Parsing and format", checks: parse ? parserChecks(facts, parse) : parsingChecks(facts) },
    { id: "contact", label: "Contact details", checks: contactChecks(facts) },
    {
      id: "sections",
      label: "Standard sections",
      // The parser's own headings check covers this.
      checks: sectionChecks(facts).filter((c) => !parse || c.id !== "headings"),
    },
    { id: "impact", label: "Impact and content", checks: impactChecks(facts) },
    { id: "length", label: "Length", checks: lengthChecks(facts) },
    ...(hasJob && match ? [{ id: "job", label: "Job match", checks: match.checks }] : []),
  ] as const;
  const losses: { label: string; lost: number }[] = [];
  const categories = groups.map((group) => {
    const maxScore = weights[group.id as keyof typeof weights];
    const totalWeight = group.checks.reduce((sum, c) => sum + c.weight, 0);
    const earned = group.checks.reduce((sum, c) => sum + c.weight * STATUS_VALUE[c.status], 0);
    for (const c of group.checks)
      losses.push({ label: c.label, lost: (maxScore * c.weight * (1 - STATUS_VALUE[c.status])) / totalWeight });
    return {
      id: group.id,
      label: group.label,
      score: Math.round((maxScore * earned) / totalWeight),
      maxScore,
      checks: group.checks.map(({ weight: _weight, ...c }) => c),
    };
  });

  const score = categories.reduce((sum, c) => sum + c.score, 0);
  const grade = GRADES.find((g) => score >= g.min)!;
  // Ties keep category order, so the summary is the same for the same input.
  const top = losses
    .filter((l) => l.lost > 0)
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 2)
    .map((l) => l.label);

  return {
    score,
    grade: grade.grade,
    summary: `${grade.text} ${top.length > 0 ? `Fix first: ${top.join(", ")}.` : "Nothing major to fix."}`,
    categories,
    keywords: match?.keywords ?? null,
    title: match?.title ?? null,
    parse: parse ? { parseRate: parse.parseRate, fields: parse.fields } : null,
    knockouts: input.jobText
      ? findKnockouts(input.jobText, {
          text: facts.text,
          ...(input.content && { content: visibleContent(input.content) }),
        })
      : null,
    stats: {
      words: facts.words,
      bullets: facts.bullets.length,
      sections: facts.sections,
      quantifiedBullets: facts.bullets.filter(isQuantified).length,
    },
  };
}

export function parsePdfItems(items: TextItem[], page: { width: number; height: number }, expected?: Expected) {
  try {
    return parseQuality(parseItems(items, page), { items, page, expected });
  } catch {
    return null;
  }
}

// Compiles the resume as it downloads and reads it back like an ATS. Any failure means scoring without it.
export async function parseTex(tex: string, expected?: Expected) {
  try {
    const compiled = await compileTex(tex);
    if (!compiled.ok) return null;
    const { items, pageWidth, pageHeight } = await extractTextItems(new Uint8Array(compiled.pdf));
    return parsePdfItems(items, { width: pageWidth, height: pageHeight }, expected);
  } catch {
    return null;
  }
}
