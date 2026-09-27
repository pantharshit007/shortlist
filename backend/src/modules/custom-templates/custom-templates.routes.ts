import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import {
  createCustomTemplateBody,
  customTemplateDetail,
  customTemplateListResponse,
  customTemplateParams,
  updateCustomTemplateBody,
} from "./custom-templates.schemas.js";
import * as service from "./custom-templates.service.js";

export const customTemplatesRouter = Router();

customTemplatesRouter.use("/custom-templates", requireAuth);

customTemplatesRouter.get("/custom-templates", async (req, res) => {
  sendData(res, customTemplateListResponse, await service.listCustomTemplates(currentUser(req).id));
});

customTemplatesRouter.post(
  "/custom-templates",
  ...validated({ body: createCustomTemplateBody }, async (req, res) => {
    sendData(res, customTemplateDetail, await service.createCustomTemplate(currentUser(req).id, req.body), 201);
  }),
);

customTemplatesRouter.get(
  "/custom-templates/:customTemplateId",
  ...validated({ params: customTemplateParams }, async (req, res) => {
    sendData(
      res,
      customTemplateDetail,
      await service.getCustomTemplate(currentUser(req).id, req.params.customTemplateId),
    );
  }),
);

customTemplatesRouter.patch(
  "/custom-templates/:customTemplateId",
  ...validated({ params: customTemplateParams, body: updateCustomTemplateBody }, async (req, res) => {
    sendData(
      res,
      customTemplateDetail,
      await service.updateCustomTemplate(currentUser(req).id, req.params.customTemplateId, req.body),
    );
  }),
);

customTemplatesRouter.delete(
  "/custom-templates/:customTemplateId",
  ...validated({ params: customTemplateParams }, async (req, res) => {
    await service.deleteCustomTemplate(currentUser(req).id, req.params.customTemplateId);
    res.status(204).end();
  }),
);
