import type { Response } from "express";
import { AppError, NotFoundError } from "../../lib/errors.js";
import { compileTex } from "../../lib/latex/compile.js";
import type { ResumeContent } from "../../schemas/resume-content.js";
import { findTemplate } from "../../templates/index.js";
import { slugify } from "../users/usernames.js";

export function renderStructured(templateId: string | null, content: ResumeContent) {
  const template = findTemplate(templateId ?? "jake");
  if (!template) throw new NotFoundError("Template");
  return template.render(content);
}

export function texForVersion(
  resume: { templateId: string | null },
  version: { content: ResumeContent | null; texSource: string | null },
) {
  return version.content ? renderStructured(resume.templateId, version.content) : version.texSource!;
}

export async function compileOrThrow(tex: string) {
  const result = await compileTex(tex);
  if (!result.ok) {
    throw new AppError(422, "COMPILE_FAILED", "The resume could not be compiled", result.errors);
  }
  return result;
}

export function pdfFileName(...parts: (string | undefined)[]) {
  const name = parts.map((part) => slugify(part ?? "", 40)).filter(Boolean).join("_");
  return `${name || "resume"}.pdf`;
}

export function sendPdf(res: Response, pdf: Buffer, fileName: string, pageCount: number, download = false) {
  res
    .status(200)
    .set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "X-Page-Count": String(pageCount),
      "Access-Control-Expose-Headers": "X-Page-Count, Content-Disposition",
      "Cache-Control": "private, max-age=0, must-revalidate",
    })
    .send(pdf);
}
