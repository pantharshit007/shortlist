import { generateStructured } from "../../lib/ai/generate.js";
import { readUpload } from "../uploads/uploads.service.js";
import { assertAiQuota } from "../usage/quotas.js";
import { extractionSchema, normalizeExtraction } from "./extraction.js";

const system = `You extract resumes into structured JSON.
Rules:
- Copy facts exactly as written. Never invent, infer or embellish employers, dates, numbers or skills.
- Keep each bullet's wording. Wrap text that is bold in the source in **double asterisks**.
- Dates: "YYYY-MM" when the month is known, otherwise "YYYY"; use "present" for ongoing roles. Use null when unknown.
- Section types: experience (jobs, internships), education, projects, skills (grouped lists like "Languages: ..."),
  links (a bare list of profile links such as LeetCode or Codeforces), list (achievements, certifications,
  positions of responsibility, anything else).
- Keep the source's section order and titles.
- Fill every field; use null or [] when something doesn't apply.`;

export async function createImport(userId: string, input: { uploadId: string } | { text: string }) {
  await assertAiQuota(userId, "import");
  let prompt = "Extract this resume.";
  const files: { data: Buffer; mediaType: string; filename: string }[] = [];

  if ("uploadId" in input) {
    const { upload, body } = await readUpload(userId, input.uploadId);
    if (upload.kind === "pdf") {
      files.push({ data: body, mediaType: "application/pdf", filename: upload.fileName });
    } else {
      const label = upload.kind === "tex" ? "LaTeX source (ignore formatting commands, extract the content)" : "text";
      prompt = `Extract this resume from its ${label}:\n\n<resume>\n${body.toString("utf8")}\n</resume>`;
    }
  } else {
    prompt = `Extract this resume:\n\n<resume>\n${input.text}\n</resume>`;
  }

  const { data, runId } = await generateStructured({
    userId,
    step: "import",
    tier: "fast",
    schema: extractionSchema,
    system,
    prompt,
    files,
  });
  return { content: normalizeExtraction(data), aiRunId: runId };
}
