import { Router } from "express";
import { track, trackServer } from "../../lib/analytics.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";
import { sendData } from "../../lib/http.js";
import { atsLimiter } from "../../middleware/rate-limit.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { getJob } from "../jobs/jobs.service.js";
import { resumeParams } from "../resumes/resumes.schemas.js";
import { getResume } from "../resumes/resumes.service.js";
import { atsReport, createAtsReportBody, createResumeAtsReportBody } from "./ats.schemas.js";
import { scoreResume, skillsInJobDescription, texToText } from "./scoring.js";

export const atsRouter = Router();

atsRouter.post(
  "/resumes/:resumeId/ats-reports",
  requireAuth,
  ...validated({ params: resumeParams, body: createResumeAtsReportBody }, async (req, res) => {
    const userId = currentUser(req).id;
    const { head } = await getResume(userId, req.params.resumeId);
    if (!head) throw new NotFoundError("Version");
    const job = req.body.jobId ? await getJob(userId, req.body.jobId) : null;
    if (job && !job.parsed) throw new ConflictError("This job hasn't been analysed yet");
    const report = scoreResume({
      content: head.content,
      text: head.texSource && texToText(head.texSource),
      job: job?.parsed
        ? {
            role: job.parsed.role,
            mustHave: job.parsed.mustHave,
            keywords: [...job.parsed.niceToHave, ...job.parsed.keywords],
          }
        : null,
    });
    track(userId, "ats_report_created", { source: "resume", score: report.score, withJob: Boolean(job) });
    sendData(res, atsReport, report);
  }),
);

// Public: the text is scored in memory and never stored or logged.
atsRouter.post(
  "/ats-reports",
  atsLimiter,
  ...validated({ body: createAtsReportBody }, (req, res) => {
    const { text, jobDescription } = req.body;
    const report = scoreResume({
      text,
      job: jobDescription ? { role: null, mustHave: [], keywords: skillsInJobDescription(jobDescription) } : null,
    });
    trackServer("ats_report_created", {
      source: "public",
      score: report.score,
      words: report.stats.words,
      bullets: report.stats.bullets,
      withJob: Boolean(jobDescription),
    });
    sendData(res, atsReport, report);
  }),
);
