import { Router } from "express";
import { usersRouter } from "./modules/users/users.routes.js";

export const v1 = Router();

v1.use(usersRouter);
