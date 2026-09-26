import { Router } from "express";
import { z } from "zod";
import { ConflictError, NotFoundError } from "../../lib/errors.js";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { getJob } from "../jobs/jobs.service.js";
import { getProfile } from "../profiles/profiles.service.js";
import { resumeParams } from "../resumes/resumes.schemas.js";
import { getResume, getVersion } from "../resumes/resumes.service.js";
import { coverageReport } from "./coverage.js";

const coverageQuery = z.object({ jobId: z.uuid(), versionId: z.uuid().optional() });

const requirement = z.object({
  requirement: z.string(),
  status: z.enum(["covered", "in_profile", "missing"]),
  foundIn: z.array(z.string()),
});

export const coverageResponse = z.object({
  // e.g. "12 of 15 requirements covered"; must-have and nice-to-have items only.
  covered: z.number().int(),
  total: z.number().int(),
  mustHave: z.array(requirement),
  niceToHave: z.array(requirement),
  keywords: z.array(requirement),
});

export { coverageQuery };

export const coverageRouter = Router();

coverageRouter.get(
  "/resumes/:resumeId/coverage",
  requireAuth,
  ...validated({ params: resumeParams, query: coverageQuery }, async (req, res) => {
    const userId = currentUser(req).id;
    const resume = await getResume(userId, req.params.resumeId);
    const version = req.query.versionId ? await getVersion(userId, resume.id, req.query.versionId) : resume.head;
    if (!version) throw new NotFoundError("Version");
    const job = await getJob(userId, req.query.jobId);
    if (!job.parsed) throw new ConflictError("This job hasn't been analysed yet");
    const profile = (await getProfile(userId)).content;
    sendData(res, coverageResponse, coverageReport(job.parsed, version, profile));
  }),
);
