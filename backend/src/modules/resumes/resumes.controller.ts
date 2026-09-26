import type { Response } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser } from "../../middleware/require-auth.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import {
  type createResumeBody,
  type createVersionBody,
  type listResumesQuery,
  type listVersionsQuery,
  resumeDetail,
  resumeListResponse,
  type resumeParams,
  resumeSummary,
  type updateResumeBody,
  type updateVersionBody,
  versionDetail,
  versionListResponse,
  type versionParams,
} from "./resumes.schemas.js";
import * as service from "./resumes.service.js";

export async function listResumes(req: ValidatedRequest<{ query: typeof listResumesQuery }>, res: Response) {
  sendData(res, resumeListResponse, await service.listResumes(currentUser(req).id, req.query.archived));
}

export async function createResume(req: ValidatedRequest<{ body: typeof createResumeBody }>, res: Response) {
  sendData(res, resumeDetail, await service.createResume(currentUser(req).id, req.body), 201);
}

export async function getResume(req: ValidatedRequest<{ params: typeof resumeParams }>, res: Response) {
  sendData(res, resumeDetail, await service.getResume(currentUser(req).id, req.params.resumeId));
}

export async function updateResume(
  req: ValidatedRequest<{ params: typeof resumeParams; body: typeof updateResumeBody }>,
  res: Response,
) {
  sendData(res, resumeSummary, await service.updateResume(currentUser(req).id, req.params.resumeId, req.body));
}

export async function deleteResume(req: ValidatedRequest<{ params: typeof resumeParams }>, res: Response) {
  await service.deleteResume(currentUser(req).id, req.params.resumeId);
  res.status(204).end();
}

export async function listVersions(
  req: ValidatedRequest<{ params: typeof resumeParams; query: typeof listVersionsQuery }>,
  res: Response,
) {
  const { limit, before } = req.query;
  sendData(res, versionListResponse, await service.listVersions(currentUser(req).id, req.params.resumeId, limit, before));
}

export async function createVersion(
  req: ValidatedRequest<{ params: typeof resumeParams; body: typeof createVersionBody }>,
  res: Response,
) {
  sendData(res, versionDetail, await service.createVersion(currentUser(req).id, req.params.resumeId, req.body), 201);
}

export async function getVersion(req: ValidatedRequest<{ params: typeof versionParams }>, res: Response) {
  const { resumeId, versionId } = req.params;
  sendData(res, versionDetail, await service.getVersion(currentUser(req).id, resumeId, versionId));
}

export async function updateVersion(
  req: ValidatedRequest<{ params: typeof versionParams; body: typeof updateVersionBody }>,
  res: Response,
) {
  const { resumeId, versionId } = req.params;
  sendData(res, versionDetail, await service.updateVersion(currentUser(req).id, resumeId, versionId, req.body));
}

