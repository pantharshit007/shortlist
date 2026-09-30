import { describe, expect, it } from "vitest";
import { knownCostUsdMicros } from "../src/lib/ai/pricing.js";

describe("knownCostUsdMicros", () => {
  it("is null when tokens were used but no price was known", () => {
    expect(knownCostUsdMicros({ costUsdMicros: 0, inputTokens: 900, outputTokens: 100 })).toBeNull();
  });
  it("keeps real costs and zero for runs that used no tokens", () => {
    expect(knownCostUsdMicros({ costUsdMicros: 4200, inputTokens: 900, outputTokens: 100 })).toBe(4200);
    expect(knownCostUsdMicros({ costUsdMicros: 0, inputTokens: 0, outputTokens: 0 })).toBe(0);
  });
});
