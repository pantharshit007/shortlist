import { z } from "zod";

export const createResumeAtsReportBody = z.object({ jobId: z.uuid().optional() });

export const createAtsReportBody = z.object({
  text: z.string().trim().min(200).max(50_000),
  jobDescription: z.string().trim().max(20_000).optional(),
});

export const atsReport = z
  .object({
    score: z.number().int().min(0).max(100),
    grade: z.enum(["excellent", "good", "fair", "poor"]),
    summary: z.string(),
    categories: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        score: z.number().int(),
        maxScore: z.number().int(),
        checks: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            status: z.enum(["pass", "warn", "fail"]),
            detail: z.string(),
            fix: z.string().nullable(),
          }),
        ),
      }),
    ),
    // Null when no job was given.
    keywords: z.object({ matched: z.array(z.string()), missing: z.array(z.string()) }).nullable(),
    stats: z.object({
      words: z.number().int(),
      bullets: z.number().int(),
      sections: z.array(z.string()),
      quantifiedBullets: z.number().int(),
    }),
  })
  .meta({ id: "AtsReport" });
