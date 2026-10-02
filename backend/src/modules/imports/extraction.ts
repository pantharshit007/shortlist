import { z } from "zod";
import { shortId } from "../../lib/ids.js";
import { type ResumeContent, resumeContentSchema, type ResumeSection } from "../../schemas/resume-content.js";

// What the model fills in. Deliberately loose (plain strings, nullable fields) so a single
// odd value doesn't fail the whole extraction; normalizeExtraction() cleans it up.
const text = z.string().nullable();
const aiLink = z.object({ label: z.string(), url: z.string() });

export const extractionSchema = z.object({
  basics: z.object({
    name: z.string(),
    headline: text.describe("Short title under the name, like 'Backend Engineer'; never a paragraph"),
    email: text,
    phone: text,
    location: text,
    links: z.array(aiLink),
  }),
  sections: z.array(
    z.object({
      type: z.enum(["experience", "education", "projects", "skills", "list", "links", "summary"]),
      title: z.string(),
      text: text.describe("summary sections only: the paragraph"),
      entries: z.array(
        z.object({
          organization: text,
          role: text,
          institution: text,
          degree: text,
          field: text,
          score: text,
          name: text,
          title: text,
          subtitle: text,
          url: text,
          location: text,
          start: text.describe("YYYY or YYYY-MM"),
          end: text.describe('YYYY, YYYY-MM or "present"'),
          date: text,
          technologies: z.array(z.string()),
          links: z.array(aiLink),
          bullets: z.array(z.string()),
        }),
      ),
      groups: z.array(z.object({ name: z.string(), items: z.array(z.string()) })),
      links: z.array(aiLink),
    }),
  ),
});

export type Extraction = z.infer<typeof extractionSchema>;

const yearMonth = /^\d{4}(-(0[1-9]|1[0-2]))?$/;
const clean = (value: string | null | undefined) => (value?.trim() ? value.trim() : undefined);
const date = (value: string | null | undefined) => {
  const v = clean(value)?.toLowerCase();
  return v && yearMonth.test(v) ? v : undefined;
};
const endDate = (value: string | null | undefined) =>
  clean(value)?.toLowerCase() === "present" ? "present" : date(value);
const url = (value: string | null | undefined) => {
  const v = clean(value);
  if (!v) return undefined;
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  // PDFs often give only a link's words ("Live", "GitHub"); keep it only if it has a real domain.
  return z.url().safeParse(withScheme).success && new URL(withScheme).hostname.includes(".") ? withScheme : undefined;
};
const links = (items: { label: string; url: string }[]) =>
  items.flatMap((item) => {
    const u = url(item.url);
    return u && clean(item.label) ? [{ label: item.label.trim().slice(0, 40), url: u }] : [];
  });
// The source's own bullet glyphs ("• Built X", "- Built X"); templates draw their own bullet.
// A dash only counts when a space follows, and "*" is left alone since "**bold**" starts with it.
const bulletMarker = /^(?:\s*(?:[•·▪▸►‣⁃◦○●■□➢➤✓✔→]|[-\u2013\u2014](?=\s)))+\s*/u;
const bullets = (items: string[]) =>
  items
    .map((b) => b.replace(bulletMarker, "").trim())
    .filter(Boolean)
    .map((text) => ({ id: shortId(), text: text.slice(0, 600), hidden: false }));

function normalizeSection(section: Extraction["sections"][number]): ResumeSection | null {
  const base = { id: shortId(), title: clean(section.title) ?? section.type, hidden: false };
  const e = section.entries;
  switch (section.type) {
    case "experience":
      return {
        ...base,
        type: "experience",
        entries: e
          .filter((x) => clean(x.organization) || clean(x.role))
          .map((x) => ({
            id: shortId(),
            hidden: false,
            organization: clean(x.organization) ?? "",
            role: clean(x.role) ?? "",
            location: clean(x.location),
            start: date(x.start),
            end: endDate(x.end),
            bullets: bullets(x.bullets),
          })),
      };
    case "education":
      return {
        ...base,
        type: "education",
        entries: e
          .filter((x) => clean(x.institution))
          .map((x) => ({
            id: shortId(),
            hidden: false,
            institution: clean(x.institution)!,
            degree: clean(x.degree),
            field: clean(x.field),
            score: clean(x.score)?.slice(0, 20),
            location: clean(x.location),
            start: date(x.start),
            end: endDate(x.end),
            bullets: bullets(x.bullets),
          })),
      };
    case "projects":
      return {
        ...base,
        type: "projects",
        entries: e
          .filter((x) => clean(x.name))
          .map((x) => ({
            id: shortId(),
            hidden: false,
            name: clean(x.name)!,
            url: url(x.url),
            links: links(x.links),
            technologies: x.technologies
              .map((t) => t.trim())
              .filter(Boolean)
              .slice(0, 20),
            start: date(x.start),
            end: endDate(x.end),
            bullets: bullets(x.bullets),
          })),
      };
    case "skills":
      return {
        ...base,
        type: "skills",
        groups: section.groups
          .filter((g) => g.items.length > 0)
          .map((g) => ({ id: shortId(), name: g.name.trim(), items: g.items.map((i) => i.trim()).filter(Boolean) })),
      };
    case "links":
      return { ...base, type: "links", links: links(section.links) };
    case "summary":
      return { ...base, type: "summary", text: clean(section.text) ?? "" };
    case "list":
      return {
        ...base,
        type: "list",
        entries: e.flatMap((x): Extract<ResumeSection, { type: "list" }>["entries"] => {
          const title = clean(x.title) ?? clean(x.name);
          // Achievements often come back as bullets with no title; each one is its own item.
          if (!title)
            return bullets(x.bullets).map((b) => ({ id: shortId(), hidden: false, title: b.text, bullets: [] }));
          return [
            {
              id: shortId(),
              hidden: false,
              title,
              subtitle: clean(x.subtitle),
              date: clean(x.date),
              url: url(x.url),
              bullets: bullets(x.bullets),
            },
          ];
        }),
      };
  }
}

export function normalizeExtraction(extraction: Extraction): ResumeContent {
  const email = clean(extraction.basics.email);
  const sections = extraction.sections.map(normalizeSection).filter((s): s is ResumeSection => s !== null);
  let headline = clean(extraction.basics.headline);
  // Models sometimes put the summary paragraph in the headline; give it its own section instead.
  if (headline && headline.length > 100 && !sections.some((s) => s.type === "summary")) {
    sections.unshift({ id: shortId(), title: "Summary", hidden: false, type: "summary", text: headline });
    headline = undefined;
  }
  const content = {
    basics: {
      name: extraction.basics.name.trim(),
      headline,
      email: email && z.email().safeParse(email).success ? email : undefined,
      phone: clean(extraction.basics.phone)?.slice(0, 30),
      location: clean(extraction.basics.location),
      links: links(extraction.basics.links),
    },
    sections,
  };
  // Drops undefined keys and applies schema defaults so the result is valid resume content.
  return fitToLimits(JSON.parse(JSON.stringify(content)));
}

// Models sometimes return a field longer than the schema allows (a paragraph as the headline);
// cut each over-long string or list to its limit instead of failing the whole import.
function fitToLimits(content: Record<string, unknown>): ResumeContent {
  for (;;) {
    const result = resumeContentSchema.safeParse(content);
    if (result.success) return result.data;
    const tooBig = result.error.issues.filter((issue) => issue.code === "too_big");
    if (tooBig.length < result.error.issues.length) throw result.error;
    for (const issue of tooBig) {
      const parent = issue.path
        .slice(0, -1)
        .reduce<unknown>((node, key) => (node as Record<PropertyKey, unknown>)[key], content) as Record<
        PropertyKey,
        string | unknown[]
      >;
      const key = issue.path.at(-1)!;
      parent[key] = parent[key]!.slice(0, Number(issue.maximum));
    }
  }
}
