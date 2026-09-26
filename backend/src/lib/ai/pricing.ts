// USD per 1M tokens. Models missing here are logged with a cost of 0.
const prices: Record<string, { input: number; cachedInput: number; output: number }> = {
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
