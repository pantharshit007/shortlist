import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { analyticsQuery, analyticsResponse } from "./analytics.schemas.js";
import { getAnalytics } from "./analytics.service.js";

export const analyticsRouter = Router();

// Views across all of the user's share links.
analyticsRouter.get(
  "/analytics",
  requireAuth,
  ...validated({ query: analyticsQuery }, async (req, res) => {
    sendData(res, analyticsResponse, await getAnalytics(currentUser(req).id, req.query.days, req.query.timeZone));
  }),
);
