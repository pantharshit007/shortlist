import { generateStructured } from "../../lib/ai/generate.js";
import { readUpload } from "../uploads/uploads.service.js";
import { assertAiQuota } from "../usage/quotas.js";
import { extractionSchema, normalizeExtraction } from "./extraction.js";
import { pdfLinks } from "./pdf-links.js";
import { track } from "../../lib/analytics.js";

const system = `You extract resumes into structured JSON.
Rules:
- Copy facts exactly as written. Never invent, infer or embellish employers, dates, numbers or skills.
- Keep each bullet's wording, without its bullet symbol ("•", "-"). Wrap text that is bold in the source in
  **double asterisks**.
- Dates: "YYYY-MM" when the month is known, otherwise "YYYY"; use "present" for ongoing roles. Use null when unknown.
- Section types: summary (a summary, profile, objective or about paragraph, in "text"), experience (jobs,
  internships), education, projects, skills (grouped lists like "Languages: ..."), links (a bare list of profile
  links such as LeetCode or Codeforces), list (achievements, certifications, positions of responsibility,
  anything else).
- The headline is only a short title under the name. A paragraph about the person is a summary section.
- In list sections, every item is its own entry. For an item written as "Name - description" (or with a colon or
  long dash), put the name in title and the description in subtitle; otherwise the whole item is the title.
- Link labels are short names like "LinkedIn", "GitHub" or "Portfolio", never the URL itself.
- Keep the source's section order and titles.
- Fill every field; use null or [] when something doesn't apply.`;

const texLabel = "LaTeX source (ignore formatting commands, extract the content)";

export async function createImport(
  userId: string,
  input: { uploadId: string } | { text: string } | { texSource: string },
) {
  await assertAiQuota(userId, "import");
  let prompt = "Extract this resume.";
  const files: { data: Buffer; mediaType: string; filename: string }[] = [];

  if ("uploadId" in input) {
    const { upload, body } = await readUpload(userId, input.uploadId);
    if (upload.kind === "pdf") {
      files.push({ data: body, mediaType: "application/pdf", filename: upload.fileName });
      const links = await pdfLinks(new Uint8Array(body));
      if (links.length) {
        prompt += `\n\nThese links are hidden behind text in the PDF. Each shows the words it sits on (or its line, for an icon), then where it points. Put each URL in the url or links field of the item it belongs to, or in basics.links for profile links:\n${links.map((l) => `- "${l.text}" -> ${l.url}`).join("\n")}`;
      }
    } else {
      const label = upload.kind === "tex" ? texLabel : "text";
      prompt = `Extract this resume from its ${label}:\n\n<resume>\n${body.toString("utf8")}\n</resume>`;
    }
  } else if ("texSource" in input) {
    prompt = `Extract this resume from its ${texLabel}:\n\n<resume>\n${input.texSource}\n</resume>`;
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
  track(userId, "resume_imported", { from: "uploadId" in input ? "file" : "text" });
  return { content: normalizeExtraction(data), aiRunId: runId };
}
