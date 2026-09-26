import { Router } from "express";
import { profilesRouter } from "./modules/profiles/profiles.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

export const v1 = Router();

v1.use(usersRouter);
v1.use(profilesRouter);
