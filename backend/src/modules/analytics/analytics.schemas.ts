import { z } from "zod";

const isTimeZone = (value: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const analyticsQuery = z.object({
  days: z.enum(["7", "30", "90"]).default("30").transform(Number),
  // Days are bucketed in the viewer's time zone so "today" matches their calendar.
  timeZone: z.string().refine(isTimeZone, "Unknown time zone").default("Asia/Kolkata"),
});

const breakdown = z.array(z.object({ label: z.string(), views: z.number().int() }));

export const analyticsResponse = z.object({
  days: z.number().int(),
  totals: z.object({
    views: z.number().int(),
    uniqueVisitors: z.number().int(),
    previousViews: z.number().int(),
    previousUniqueVisitors: z.number().int(),
  }),
  viewsByDay: z.array(z.object({ day: z.string(), views: z.number().int() })),
  links: z.array(
    z.object({
      id: z.uuid(),
      slug: z.string(),
      resumeId: z.uuid(),
      resumeTitle: z.string(),
      views: z.number().int(),
      totalViews: z.number().int(),
      lastViewedAt: z.date().nullable(),
    }),
  ),
  referrers: breakdown,
  countries: breakdown,
  devices: breakdown,
  recentViews: z.array(
    z.object({
      id: z.uuid(),
      viewedAt: z.date(),
      shareLinkId: z.uuid(),
      slug: z.string(),
      resumeTitle: z.string(),
      referrer: z.string().nullable(),
      country: z.string().nullable(),
      device: z.string().nullable(),
    }),
  ),
});
