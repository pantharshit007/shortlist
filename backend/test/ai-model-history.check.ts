// Run against a migrated local database: pnpm exec tsx --env-file=.env test/ai-model-history.check.ts
// Provider responses are stubbed; only this check's temporary account is changed.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db/index.js";
import { users } from "../src/db/schema/index.js";
import { getAiKey, putAiKey, updateAiKey } from "../src/modules/ai-keys/ai-keys.service.js";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = String(input);
  assert.ok(url.startsWith("https://openrouter.ai/") || url.startsWith("https://api.anthropic.com/"));
  return Response.json(
    url.startsWith("https://openrouter.ai/")
      ? {
          id: "check",
          model: "check",
          object: "chat.completion",
          created: 0,
          choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }
      : {
          id: "check",
          model: "check",
          type: "message",
          role: "assistant",
          content: [{ type: "text", text: "OK" }],
          stop_reason: "end_turn",
          stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
        },
  );
};

const id = randomUUID();
const apiKey = "sk-local-history-check-never-sent";
try {
  await db
    .insert(users)
    .values({ id, name: "Model history check", email: `${id}@example.test`, username: `check-${id.slice(0, 8)}` });
  await putAiKey(id, { provider: "openrouter", apiKey, modelId: "first-model" });
  await Promise.all([updateAiKey(id, { modelId: "second-model" }), updateAiKey(id, { modelId: "third-model" })]);
  await updateAiKey(id, { modelId: "first-model", enabled: false });
  await updateAiKey(id, { modelId: null });
  assert.deepEqual((await getAiKey(id))?.modelIds.sort(), ["first-model", "second-model", "third-model"]);
  assert.equal((await getAiKey(id))?.enabled, false);
  await putAiKey(id, { provider: "openrouter", apiKey: `${apiKey}-replacement`, modelId: "fourth-model" });
  assert.deepEqual((await getAiKey(id))?.modelIds.sort(), [
    "first-model",
    "fourth-model",
    "second-model",
    "third-model",
  ]);
  await putAiKey(id, { provider: "anthropic", apiKey, modelId: "anthropic-model" });
  assert.deepEqual((await getAiKey(id))?.modelIds, ["anthropic-model"]);
  assert.equal((await getAiKey(id))?.enabled, true);
  console.log("Model history: concurrent saves, deduplication, defaults, key replacement and provider change passed.");
} finally {
  globalThis.fetch = originalFetch;
  await db.delete(users).where(eq(users.id, id));
  await pool.end();
}
