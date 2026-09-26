import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import * as controller from "./resumes.controller.js";
import {
  createResumeBody,
  createVersionBody,
  listResumesQuery,
  listVersionsQuery,
  resumeParams,
  updateResumeBody,
  updateVersionBody,
  versionParams,
} from "./resumes.schemas.js";

export const resumesRouter = Router();

resumesRouter.use("/resumes", requireAuth);

resumesRouter.get("/resumes", ...validated({ query: listResumesQuery }, controller.listResumes));
resumesRouter.post("/resumes", ...validated({ body: createResumeBody }, controller.createResume));
resumesRouter.get("/resumes/:resumeId", ...validated({ params: resumeParams }, controller.getResume));
resumesRouter.patch(
  "/resumes/:resumeId",
  ...validated({ params: resumeParams, body: updateResumeBody }, controller.updateResume),
);
resumesRouter.delete("/resumes/:resumeId", ...validated({ params: resumeParams }, controller.deleteResume));

resumesRouter.get(
  "/resumes/:resumeId/versions",
  ...validated({ params: resumeParams, query: listVersionsQuery }, controller.listVersions),
);
resumesRouter.post(
  "/resumes/:resumeId/versions",
  ...validated({ params: resumeParams, body: createVersionBody }, controller.createVersion),
);
resumesRouter.get(
  "/resumes/:resumeId/versions/:versionId",
  ...validated({ params: versionParams }, controller.getVersion),
);
resumesRouter.patch(
  "/resumes/:resumeId/versions/:versionId",
  ...validated({ params: versionParams, body: updateVersionBody }, controller.updateVersion),
);
