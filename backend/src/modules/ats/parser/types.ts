// PDF user-space units, y measured down from the top of the page, one item per pdf.js text run.
export type TextItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  fontName?: string | undefined;
  bold?: boolean | undefined;
};

export type SectionKind = "experience" | "education" | "skills" | "projects" | "summary" | "other";

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  links: string[];
  sections: { heading: string; kind: SectionKind | null; lines: string[] }[];
  jobs: { title: string | null; company: string | null; dates: string | null }[];
  readingOrderIssues: number;
};

export type ParseIssue = {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  fix: string | null;
};

export type ParseReport = {
  parseRate: number | null;
  fields: { id: string; label: string; found: string | null; expected: string | null; ok: boolean }[];
  issues: ParseIssue[];
  parsed: ParsedResume;
};
