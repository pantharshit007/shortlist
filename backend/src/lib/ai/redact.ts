import type { ResumeContent } from "../../schemas/resume-content.js";

type Kind = "email" | "phone" | "name" | "location" | "link" | "company";

// ponytail: pattern matching catches common email and phone formats (including ones only in LaTeX source);
// a phone written in an unusual format outside the content's phone field still reaches the model.
const emailPattern = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const phonePattern = /\+\d{1,3}[\s-]?\d[\d\s-]{7,}\d|\b[6-9]\d{9}\b/g;

function sensitiveValues(content: ResumeContent): [Kind, string | undefined][] {
  const { basics } = content;
  const links = [
    ...basics.links,
    ...content.sections.flatMap((s) =>
      s.type === "links" ? s.links : s.type === "projects" ? s.entries.flatMap((e) => e.links) : [],
    ),
  ];
  return [
    // Always masked: no AI edit needs a way to contact the user.
    ["email", basics.email],
    ["phone", basics.phone],
    ["name", basics.sensitive?.includes("name") ? basics.name : undefined],
    ["location", basics.sensitive?.includes("location") ? basics.location : undefined],
    ...links.filter((l) => l.sensitive).map((l): [Kind, string] => ["link", l.url]),
    ...content.sections.flatMap((s) =>
      s.type === "experience"
        ? s.entries.filter((e) => e.sensitive).map((e): [Kind, string] => ["company", e.organization])
        : [],
    ),
  ];
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function mapStrings<T>(value: T, fn: (text: string) => string): T {
  if (typeof value === "string") return fn(value) as T;
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fn)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, mapStrings(item, fn)])) as T;
  }
  return value;
}

// Replaces the user's sensitive values in a prompt with placeholders like "[email 1]". `restore` puts the real
// values back into anything the model returns, so they never leave the server.
export function redact(prompt: string, contents: ResumeContent[]) {
  const found: [Kind, string | undefined][] = [
    ...contents.flatMap(sensitiveValues),
    ...[...prompt.matchAll(emailPattern)].map((m): [Kind, string] => ["email", m[0]]),
    ...[...prompt.matchAll(phonePattern)].map((m): [Kind, string] => ["phone", m[0].trim()]),
  ];

  const placeholders = new Map<string, string>();
  const originals = new Map<string, string>();
  const counts: Partial<Record<Kind, number>> = {};
  for (const [kind, raw] of found) {
    const value = raw?.trim();
    if (!value || value.length < 2) continue;
    // The same value may appear JSON-escaped (in stringified content) or LaTeX-escaped (in tex source).
    const variants = [value, JSON.stringify(value).slice(1, -1), value.replace(/[&%_#$]/g, "\\$&")];
    if (variants.some((v) => placeholders.has(v.toLowerCase()))) continue;
    counts[kind] = (counts[kind] ?? 0) + 1;
    const placeholder = `[${kind} ${counts[kind]}]`;
    originals.set(placeholder, value);
    for (const v of variants) placeholders.set(v.toLowerCase(), placeholder);
  }

  if (placeholders.size === 0) return { text: prompt, restore: <T>(value: T) => value };

  // One pass, longest first, so a value inside a longer one (a company inside an email) can't split it.
  const alternatives = [...placeholders.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives.join("|")})(?![\\p{L}\\p{N}])`, "giu");
  const restorePattern = new RegExp([...originals.keys()].map(escapeRegExp).join("|"), "g");

  return {
    text: prompt.replace(pattern, (match) => placeholders.get(match.toLowerCase())!),
    restore: <T>(value: T) => mapStrings(value, (text) => text.replace(restorePattern, (p) => originals.get(p)!)),
  };
}
