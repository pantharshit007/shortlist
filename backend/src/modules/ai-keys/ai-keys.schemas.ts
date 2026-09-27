import { z } from "zod";

export const aiProviderSchema = z.enum(["openai", "anthropic", "openrouter"]);

export const putAiKeyBody = z.object({
  provider: aiProviderSchema,
  apiKey: z.string().trim().min(10).max(300),
  // e.g. "gpt-5.4-mini" or, on OpenRouter, "anthropic/claude-sonnet-5". Empty uses the provider's defaults.
  modelId: z
    .string()
    .trim()
    .max(100)
    .regex(/^[\w.:/-]+$/, "Letters, numbers and . : / - _ only")
    .nullish(),
});

export const aiKeyResponse = z
  .object({
    provider: aiProviderSchema,
    modelId: z.string().nullable(),
    keyHint: z.string(),
    verifiedAt: z.date(),
  })
  .nullable();
