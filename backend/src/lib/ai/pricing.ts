// USD per 1M tokens, standard tier (https://developers.openai.com/api/docs/pricing). Models missing here
// are logged with a cost of 0.
const prices: Record<string, { input: number; cachedInput: number; output: number }> = {
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-5.5": { input: 5, cachedInput: 0.5, output: 30 },
  "claude-haiku-4-5": { input: 1, cachedInput: 0.1, output: 5 },
  "claude-sonnet-5": { input: 2, cachedInput: 0.2, output: 10 },
};

function priceFor(modelId: string) {
  return prices[modelId] ?? prices[modelId.split("/").pop() ?? ""];
}

export function costUsdMicros(
  modelId: string,
  usage: { inputTokens: number; cachedInputTokens: number; outputTokens: number },
): number {
  const price = priceFor(modelId);
  if (!price) return 0;
  const uncached = usage.inputTokens - usage.cachedInputTokens;
  // Price per 1M tokens equals micro-dollars per token.
  return Math.round(
    uncached * price.input + usage.cachedInputTokens * price.cachedInput + usage.outputTokens * price.output,
  );
}
