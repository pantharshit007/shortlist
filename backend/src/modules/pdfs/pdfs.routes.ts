import { Router } from "express";
import { NotFoundError } from "../../lib/errors.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { resumeParams } from "../resumes/resumes.schemas.js";
import { getResume, getVersion } from "../resumes/resumes.service.js";
import { createPreviewBody, resumePdfQuery } from "./pdfs.schemas.js";
import { compileOrThrow, pdfFileName, renderStructured, sendPdf, texForVersion } from "./pdfs.service.js";

export const pdfsRouter = Router();

pdfsRouter.get(
  "/resumes/:resumeId/pdf",
  requireAuth,
  ...validated({ params: resumeParams, query: resumePdfQuery }, async (req, res) => {
    const userId = currentUser(req).id;
    const resume = await getResume(userId, req.params.resumeId);
    const version = req.query.versionId ? await getVersion(userId, resume.id, req.query.versionId) : resume.head;
    if (!version) throw new NotFoundError("Version");

    const { pdf, pageCount } = await compileOrThrow(texForVersion(resume, version));
    sendPdf(res, pdf, pdfFileName(version.content?.basics.name, resume.title), pageCount, req.query.download);
  }),
);

// Compiles unsaved editor state for the live preview.
pdfsRouter.post(
  "/previews",
  requireAuth,
  ...validated({ body: createPreviewBody }, async (req, res) => {
    const tex = "content" in req.body ? renderStructured(req.body.templateId, req.body.content) : req.body.texSource;
    const { pdf, pageCount } = await compileOrThrow(tex);
    sendPdf(res, pdf, "preview.pdf", pageCount);
  }),
);
