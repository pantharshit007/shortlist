import type { Request, Response } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser } from "../../middleware/require-auth.js";
import type { ValidatedRequest } from "../../middleware/validate.js";
import * as usersService from "./users.service.js";
import { meResponse, type updateMeBody, type usernameParams, usernameResponse } from "./users.schemas.js";
import { isUsernameAvailable } from "./usernames.js";
import { isAdmin } from "../../middleware/require-admin.js";

const withAdmin = <U extends { email: string; emailVerified: boolean }>(user: U) => ({
  ...user,
  isAdmin: isAdmin(user),
});

export async function getMe(req: Request, res: Response) {
  sendData(res, meResponse, withAdmin(await usersService.getMe(currentUser(req).id)));
}

export async function updateMe(req: ValidatedRequest<{ body: typeof updateMeBody }>, res: Response) {
  sendData(res, meResponse, withAdmin(await usersService.updateMe(currentUser(req).id, req.body)));
}

export async function deleteMe(req: Request, res: Response) {
  await usersService.deleteMe(currentUser(req).id);
  res.status(204).end();
}

export async function getUsername(req: ValidatedRequest<{ params: typeof usernameParams }>, res: Response) {
  const { username } = req.params;
  sendData(res, usernameResponse, { username, available: await isUsernameAvailable(username) });
}

export async function exportMyData(req: Request, res: Response) {
  res
    .set("Content-Disposition", 'attachment; filename="my-data.json"')
    .json({ data: await usersService.exportMyData(currentUser(req).id) });
}
