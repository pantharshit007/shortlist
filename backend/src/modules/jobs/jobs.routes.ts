import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { createJobBody, jobListResponse, jobParams, jobResponse } from "./jobs.schemas.js";
import * as service from "./jobs.service.js";

export const jobsRouter = Router();

jobsRouter.use("/jobs", requireAuth);

jobsRouter.get("/jobs", async (req, res) => {
  sendData(res, jobListResponse, await service.listJobs(currentUser(req).id));
});

jobsRouter.post(
  "/jobs",
  ...validated({ body: createJobBody }, async (req, res) => {
    sendData(res, jobResponse, await service.createJob(currentUser(req).id, req.body), 201);
  }),
);

jobsRouter.get(
  "/jobs/:jobId",
  ...validated({ params: jobParams }, async (req, res) => {
    sendData(res, jobResponse, await service.getJob(currentUser(req).id, req.params.jobId));
  }),
);

jobsRouter.delete(
  "/jobs/:jobId",
  ...validated({ params: jobParams }, async (req, res) => {
    await service.deleteJob(currentUser(req).id, req.params.jobId);
    res.status(204).end();
  }),
);
