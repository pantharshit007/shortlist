import type { Request, Response } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser } from "../../middleware/require-auth.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import * as usersService from "./users.service.js";
import { meResponse, type updateMeBody, type usernameParams, usernameResponse } from "./users.schemas.js";
import { isUsernameAvailable } from "./usernames.js";

export async function getMe(req: Request, res: Response) {
  sendData(res, meResponse, await usersService.getMe(currentUser(req).id));
}

export async function updateMe(req: ValidatedRequest<{ body: typeof updateMeBody }>, res: Response) {
  sendData(res, meResponse, await usersService.updateMe(currentUser(req).id, req.body));
}

export async function deleteMe(req: Request, res: Response) {
  await usersService.deleteMe(currentUser(req).id);
  res.status(204).end();
}

export async function getUsername(req: ValidatedRequest<{ params: typeof usernameParams }>, res: Response) {
  const { username } = req.params;
  sendData(res, usernameResponse, { username, available: await isUsernameAvailable(username) });
}
