import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { env } from "../../config/env.js";
import { AppError } from "../errors.js";

export type AiProvider = "openai" | "anthropic" | "openrouter";

// fast: extraction, JD parsing, inline edits. smart: tailoring plan and rewrite.
export type ModelTier = "fast" | "smart";

export const defaultModels: Record<AiProvider, Record<ModelTier, string>> = {
  openai: { fast: "gpt-5.4-mini", smart: "gpt-5.5" },
  anthropic: { fast: "claude-haiku-4-5", smart: "claude-sonnet-5" },
  openrouter: { fast: "openai/gpt-5.4-mini", smart: "anthropic/claude-sonnet-5" },
};

export type ResolvedModel = {
  model: LanguageModel;
  provider: AiProvider;
  modelId: string;
};

export function createModel(provider: AiProvider, apiKey: string, modelId: string): LanguageModel {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "openrouter":
      return createOpenRouter({ apiKey })(modelId);
  }
}

const apiKeys: Record<AiProvider, string | undefined> = {
  openai: env.OPENAI_API_KEY,
  anthropic: env.ANTHROPIC_API_KEY,
  openrouter: env.OPENROUTER_API_KEY,
};

// A user-supplied key (BYOK) takes precedence over the server's own configuration.
export function resolveModel(
  tier: ModelTier,
  userKey?: { provider: AiProvider; apiKey: string; modelId?: string },
): ResolvedModel {
  const provider = userKey?.provider ?? env.AI_PROVIDER;
  const apiKey = userKey?.apiKey ?? apiKeys[provider];
  if (!apiKey) {
    throw new AppError(503, "AI_NOT_CONFIGURED", `No API key configured for ${provider}`);
  }

  const override = tier === "fast" ? env.AI_MODEL_FAST : env.AI_MODEL_SMART;
  const modelId = userKey?.modelId ?? (userKey ? undefined : override) ?? defaultModels[provider][tier];

  return { model: createModel(provider, apiKey, modelId), provider, modelId };
}
