import type { Request, Response } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser } from "../../middleware/require-auth.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import { profileResponse, type putProfileBody } from "./profiles.schemas.js";
import * as profilesService from "./profiles.service.js";

export async function getProfile(req: Request, res: Response) {
  sendData(res, profileResponse, await profilesService.getProfile(currentUser(req).id));
}

export async function putProfile(req: ValidatedRequest<{ body: typeof putProfileBody }>, res: Response) {
  sendData(res, profileResponse, await profilesService.putProfile(currentUser(req).id, req.body.content));
}
