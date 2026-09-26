import { generateObject } from "ai";
import type { z } from "zod";
import { db } from "../../db/index.js";
import { aiRuns } from "../../db/schema/index.js";
import { AppError } from "../errors.js";
import { logger } from "../logger.js";
import { type AiProvider, type ModelTier, resolveModel } from "./models.js";
import { costUsdMicros } from "./pricing.js";

type AiStep = (typeof aiRuns.$inferInsert)["step"];

export type GenerateStructuredInput<S extends z.ZodType> = {
  userId: string;
  step: AiStep;
  tier: ModelTier;
  schema: S;
  system: string;
  prompt: string;
  resumeId?: string;
  jobId?: string;
  userKey?: { provider: AiProvider; apiKey: string; modelId?: string };
};

// Every AI call goes through here so it is logged in ai_runs with tokens, cost and latency.
export async function generateStructured<S extends z.ZodType>(
  input: GenerateStructuredInput<S>,
): Promise<{ data: z.infer<S>; runId: string }> {
  const { model, provider, modelId } = resolveModel(input.tier, input.userKey);
  const started = Date.now();
  const base = {
    userId: input.userId,
    step: input.step,
    model: `${provider}:${modelId}`,
    resumeId: input.resumeId ?? null,
    jobId: input.jobId ?? null,
  };

  try {
    const result = await generateObject({
      model,
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
    });

    const usage = {
      inputTokens: result.usage.inputTokens ?? 0,
      cachedInputTokens: result.usage.inputTokenDetails?.cacheReadTokens ?? 0,
      outputTokens: result.usage.outputTokens ?? 0,
    };

    const [run] = await db
      .insert(aiRuns)
      .values({
        ...base,
        status: "succeeded",
        ...usage,
        costUsdMicros: costUsdMicros(modelId, usage),
        latencyMs: Date.now() - started,
      })
      .returning({ id: aiRuns.id });

    return { data: result.object as z.infer<S>, runId: run!.id };
  } catch (err) {
    logger.error({ err, step: input.step, model: base.model }, "AI generation failed");
    await db.insert(aiRuns).values({
      ...base,
      status: "failed",
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    throw new AppError(502, "AI_FAILED", "The AI model could not complete this request. Try again.");
  }
}
