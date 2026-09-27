import { generateText } from "ai";
import { eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "../../db/index.js";
import { userAiKeys } from "../../db/schema/index.js";
import { userKeyError } from "../../lib/ai/key-errors.js";
import { AppError } from "../../lib/errors.js";
import { type AiProvider, createModel, defaultModels } from "../../lib/ai/models.js";
import { open, seal } from "../../lib/secret-box.js";
import type { putAiKeyBody } from "./ai-keys.schemas.js";

const publicColumns = {
  provider: userAiKeys.provider,
  modelId: userAiKeys.modelId,
  keyHint: userAiKeys.keyHint,
  verifiedAt: userAiKeys.verifiedAt,
};

export async function getAiKey(userId: string) {
  const [row] = await db.select(publicColumns).from(userAiKeys).where(eq(userAiKeys.userId, userId)).limit(1);
  return row ?? null;
}

// The decrypted key for AI calls. Only the AI layer should call this.
export async function loadUserAiKey(userId: string) {
  const [row] = await db.select().from(userAiKeys).where(eq(userAiKeys.userId, userId)).limit(1);
  if (!row) return undefined;
  let apiKey: string;
  try {
    apiKey = open(row.encryptedKey);
  } catch {
    // The encryption secret changed since the key was saved.
    throw new AppError(422, "AI_KEY_UNREADABLE", "Your saved API key can't be read anymore. Add it again in Settings.");
  }
  return { provider: row.provider, apiKey, ...(row.modelId && { modelId: row.modelId }) };
}

export async function hasUserAiKey(userId: string) {
  return (await getAiKey(userId)) !== null;
}

// One tiny request per model the key will be used with, so a bad key or model fails here, not mid-tailor.
async function verify(provider: AiProvider, apiKey: string, modelId: string | undefined) {
  const models = modelId ? [modelId] : [...new Set(Object.values(defaultModels[provider]))];
  for (const id of models) {
    try {
      await generateText({
        model: createModel(provider, apiKey, id),
        prompt: "Reply with the single word OK.",
        maxOutputTokens: 16,
        abortSignal: AbortSignal.timeout(20_000),
      });
    } catch (err) {
      throw userKeyError(provider, err);
    }
  }
}

export async function putAiKey(userId: string, input: z.infer<typeof putAiKeyBody>) {
  const modelId = input.modelId || null;
  await verify(input.provider, input.apiKey, modelId ?? undefined);
  const values = {
    provider: input.provider,
    modelId,
    encryptedKey: seal(input.apiKey),
    keyHint: input.apiKey.slice(-4),
    verifiedAt: new Date(),
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(userAiKeys)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: userAiKeys.userId, set: values })
    .returning(publicColumns);
  return row!;
}

export async function deleteAiKey(userId: string) {
  await db.delete(userAiKeys).where(eq(userAiKeys.userId, userId));
}
