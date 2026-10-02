import { describe, expect, it } from "vitest";
import { withSlot } from "../src/modules/admin/posthog.js";

describe("PostHog query queue", () => {
  it("never runs more than three queries at once and runs them all", async () => {
    let running = 0;
    let peak = 0;
    const query = () =>
      withSlot(async () => {
        peak = Math.max(peak, ++running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
        return true;
      });
    const results = await Promise.all(Array.from({ length: 10 }, query));
    expect(results).toHaveLength(10);
    expect(peak).toBe(3);
  });
});
