import { Router } from "express";
import { z } from "zod";
import { aiRunStatus, aiStep } from "../../db/schema/index.js";
import { sendData } from "../../lib/http.js";
import { currentUser, requireAuth } from "../../middleware/require-auth.js";
import { listAiRuns } from "./ai-runs.service.js";

export const aiRunListResponse = z.object({
  periodStart: z.date(),
  // Known costs this calendar month (UTC), in millionths of a US dollar.
  monthCostUsdMicros: z.number().int(),
  // Runs this month whose model has no known price, so they aren't in the total.
  monthUnpricedRuns: z.number().int(),
  // The 20 most recent, newest first.
  runs: z.array(
    z.object({
      id: z.uuid(),
      createdAt: z.date(),
      step: z.enum(aiStep.enumValues),
      status: z.enum(aiRunStatus.enumValues),
      model: z.string(),
      byok: z.boolean(),
      inputTokens: z.number().int(),
      outputTokens: z.number().int(),
      costUsdMicros: z.number().int().nullable(),
      latencyMs: z.number().int().nullable(),
      resumeId: z.uuid().nullable(),
    }),
  ),
});

export const aiRunsRouter = Router();

aiRunsRouter.get("/me/ai-runs", requireAuth, async (req, res) => {
  sendData(res, aiRunListResponse, await listAiRuns(currentUser(req).id));
});
