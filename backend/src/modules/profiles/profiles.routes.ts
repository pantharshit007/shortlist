import { Router } from "express";
import { requireAuth } from "../../middleware/require-auth.js";
import { validate } from "../../middleware/validate.js";
import * as controller from "./profiles.controller.js";
import { putProfileBody } from "./profiles.schemas.js";

export const profilesRouter = Router();

profilesRouter.get("/profile", requireAuth, controller.getProfile);
profilesRouter.put("/profile", requireAuth, validate({ body: putProfileBody }), controller.putProfile);
