import { Router } from "express";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { validated } from "../../middleware/validate.js";
import { assertPaidPlan } from "../usage/quotas.js";
import { analyticsQuery, analyticsResponse, insightsResponse, viewExportResponse } from "./analytics.schemas.js";
import { exportViews, getAnalytics, getInsights } from "./analytics.service.js";

export const analyticsRouter = Router();

// Views across all of the user's share links.
analyticsRouter.get(
  "/analytics",
  requireAuth,
  ...validated({ query: analyticsQuery }, async (req, res) => {
    sendData(res, analyticsResponse, await getAnalytics(currentUser(req).id, req.query.days, req.query.timeZone));
  }),
);

analyticsRouter.get(
  "/analytics/insights",
  requireAuth,
  ...validated({ query: analyticsQuery }, async (req, res) => {
    const userId = currentUser(req).id;
    await assertPaidPlan(userId, "Detailed analytics");
    sendData(res, insightsResponse, await getInsights(userId, req.query.days, req.query.timeZone));
  }),
);

// Every view in the range, for a CSV download.
analyticsRouter.get(
  "/analytics/views",
  requireAuth,
  ...validated({ query: analyticsQuery }, async (req, res) => {
    const userId = currentUser(req).id;
    await assertPaidPlan(userId, "Exporting views");
    sendData(res, viewExportResponse, await exportViews(userId, req.query.days));
  }),
);
