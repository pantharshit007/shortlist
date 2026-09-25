import { index, integer, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { createdAt } from "./columns.js";
import { jobs, resumes, resumeVersions } from "./resumes.js";

export const aiStep = pgEnum("ai_step", [
  "import",
  "jd_parse",
  "plan",
  "rewrite",
  "verify",
  "inline_edit",
  "chat_edit",
  "fix_compile",
]);

export const aiRunStatus = pgEnum("ai_run_status", ["succeeded", "failed"]);

// Log of every AI call: for cost tracking, quotas and acceptance rate.
export const aiRuns = pgTable(
  "ai_runs",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resumeId: uuid().references(() => resumes.id, { onDelete: "set null" }),
    jobId: uuid().references(() => jobs.id, { onDelete: "set null" }),
    // The version the AI's accepted changes were saved as, if any.
    versionId: uuid().references(() => resumeVersions.id, {
      onDelete: "set null",
    }),
    step: aiStep().notNull(),
    status: aiRunStatus().notNull(),
    model: text().notNull(),
    inputTokens: integer().notNull().default(0),
    cachedInputTokens: integer().notNull().default(0),
    outputTokens: integer().notNull().default(0),
    // Cost in millionths of a US dollar, to avoid floating point.
    costUsdMicros: integer().notNull().default(0),
    latencyMs: integer(),
    patchOps: jsonb(),
    acceptedOpIds: jsonb().$type<string[]>(),
    error: text(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.createdAt), index().on(t.resumeId)],
);
