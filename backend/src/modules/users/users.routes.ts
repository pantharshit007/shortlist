import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import * as controller from "./users.controller.js";
import { updateMeBody, usernameParams } from "./users.schemas.js";

export const usersRouter = Router();

usersRouter.get("/me", requireAuth, controller.getMe);
usersRouter.patch("/me", requireAuth, ...validated({ body: updateMeBody }, controller.updateMe));
usersRouter.delete("/me", requireAuth, controller.deleteMe);
usersRouter.get("/usernames/:username", ...validated({ params: usernameParams }, controller.getUsername));
