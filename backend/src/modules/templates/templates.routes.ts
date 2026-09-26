import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { templateListResponse } from "./templates.schemas.js";
import { listTemplates } from "./templates.service.js";

export const templatesRouter = Router();

templatesRouter.get("/templates", async (_req, res) => {
  sendData(res, templateListResponse, await listTemplates());
});
