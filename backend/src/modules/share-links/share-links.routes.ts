import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { resumeParams } from "../resumes/resumes.schemas.js";
import {
  createShareLinkBody,
  shareLinkListResponse,
  shareLinkParams,
  shareLinkResponse,
  shareLinkStatsResponse,
  updateShareLinkBody,
} from "./share-links.schemas.js";
import * as service from "./share-links.service.js";

export const shareLinksRouter = Router();

shareLinksRouter.get(
  "/resumes/:resumeId/share-links",
  requireAuth,
  ...validated({ params: resumeParams }, async (req, res) => {
    sendData(res, shareLinkListResponse, await service.listShareLinks(currentUser(req).id, req.params.resumeId));
  }),
);

shareLinksRouter.post(
  "/resumes/:resumeId/share-links",
  requireAuth,
  ...validated({ params: resumeParams, body: createShareLinkBody }, async (req, res) => {
    sendData(
      res,
      shareLinkResponse,
      await service.createShareLink(currentUser(req).id, req.params.resumeId, req.body),
      201,
    );
  }),
);

shareLinksRouter.get(
  "/share-links/:shareLinkId",
  requireAuth,
  ...validated({ params: shareLinkParams }, async (req, res) => {
    sendData(res, shareLinkResponse, await service.getShareLink(currentUser(req).id, req.params.shareLinkId));
  }),
);

shareLinksRouter.patch(
  "/share-links/:shareLinkId",
  requireAuth,
  ...validated({ params: shareLinkParams, body: updateShareLinkBody }, async (req, res) => {
    sendData(
      res,
      shareLinkResponse,
      await service.updateShareLink(currentUser(req).id, req.params.shareLinkId, req.body),
    );
  }),
);

shareLinksRouter.delete(
  "/share-links/:shareLinkId",
  requireAuth,
  ...validated({ params: shareLinkParams }, async (req, res) => {
    await service.deleteShareLink(currentUser(req).id, req.params.shareLinkId);
    res.status(204).end();
  }),
);

shareLinksRouter.get(
  "/share-links/:shareLinkId/stats",
  requireAuth,
  ...validated({ params: shareLinkParams }, async (req, res) => {
    sendData(res, shareLinkStatsResponse, await service.getShareLinkStats(currentUser(req).id, req.params.shareLinkId));
  }),
);
