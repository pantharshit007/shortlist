import { describe, expect, it } from "vitest";
import { dayKeys, shapeInsights } from "../src/modules/analytics/analytics.service.js";

describe("shapeInsights", () => {
  const keys = dayKeys(3, "Asia/Kolkata", new Date("2026-10-02T06:00:00Z"));

  it("fills every hour of the week, Monday first", () => {
    const { heatmap } = shapeInsights(
      keys,
      [
        { weekday: 1, hour: 9, views: 2 },
        { weekday: 7, hour: 23, views: 1 },
      ],
      [],
      [],
    );
    expect(heatmap).toHaveLength(7);
    expect(heatmap.every((row) => row.length === 24)).toBe(true);
    expect(heatmap[0]![9]).toBe(2);
    expect(heatmap[6]![23]).toBe(1);
    expect(heatmap.flat().reduce((a, b) => a + b)).toBe(3);
  });

  it("gives each link a zero-filled day series in range order", () => {
    const { links } = shapeInsights(
      keys,
      [],
      [
        { linkId: "a", day: "2026-10-02", views: 3 },
        { linkId: "b", day: "2026-09-30", views: 1 },
        { linkId: "a", day: "2026-09-30", views: 1 },
      ],
      [{ linkId: "a", views: 4, repeatOpens: 1, topSource: "direct" }],
    );
    expect(keys).toEqual(["2026-09-30", "2026-10-01", "2026-10-02"]);
    expect(links).toEqual([
      {
        id: "a",
        views: 4,
        repeatOpens: 1,
        topSource: "direct",
        viewsByDay: [
          { day: "2026-09-30", views: 1 },
          { day: "2026-10-01", views: 0 },
          { day: "2026-10-02", views: 3 },
        ],
      },
    ]);
  });
});
