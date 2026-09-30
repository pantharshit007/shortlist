import { and, count, desc, eq, gt, gte, sql, sum } from "drizzle-orm";
import { db } from "../../db/index.js";
import { aiRuns } from "../../db/schema/index.js";
import { knownCostUsdMicros } from "../../lib/ai/pricing.js";
import { periodStart } from "../usage/quotas.js";

// Only usage numbers: never prompts, outputs, errors or resume content.
export async function listAiRuns(userId: string) {
  const [runs, [month], [unpriced]] = await Promise.all([
    db
      .select({
        id: aiRuns.id,
        createdAt: aiRuns.createdAt,
        step: aiRuns.step,
        status: aiRuns.status,
        model: aiRuns.model,
        byok: aiRuns.byok,
        inputTokens: aiRuns.inputTokens,
        outputTokens: aiRuns.outputTokens,
        costUsdMicros: aiRuns.costUsdMicros,
        latencyMs: aiRuns.latencyMs,
        resumeId: aiRuns.resumeId,
      })
      .from(aiRuns)
      .where(eq(aiRuns.userId, userId))
      .orderBy(desc(aiRuns.createdAt))
      .limit(20),
    db
      .select({ cost: sum(aiRuns.costUsdMicros).mapWith(Number) })
      .from(aiRuns)
      .where(and(eq(aiRuns.userId, userId), gte(aiRuns.createdAt, periodStart()))),
    db
      .select({ value: count() })
      .from(aiRuns)
      .where(
        and(
          eq(aiRuns.userId, userId),
          gte(aiRuns.createdAt, periodStart()),
          eq(aiRuns.costUsdMicros, 0),
          gt(sql`${aiRuns.inputTokens} + ${aiRuns.outputTokens}`, 0),
        ),
      ),
  ]);
  return {
    periodStart: periodStart(),
    monthCostUsdMicros: month?.cost ?? 0,
    monthUnpricedRuns: unpriced?.value ?? 0,
    runs: runs.map((run) => ({ ...run, costUsdMicros: knownCostUsdMicros(run) })),
  };
}
