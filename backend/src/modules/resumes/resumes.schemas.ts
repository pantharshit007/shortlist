import { z } from "zod";
import { resumeContentSchema } from "../../schemas/resume-content.js";

export const texSourceSchema = z.string().min(1).max(200_000);
const idParam = z.uuid();

export const resumeParams = z.object({ resumeId: idParam });
export const versionParams = z.object({ resumeId: idParam, versionId: idParam });

// Where a new resume's first version comes from.
const resumeSource = z.discriminatedUnion("type", [
  z.object({ type: z.literal("blank") }),
  z.object({ type: z.literal("profile") }),
  z.object({ type: z.literal("content"), content: resumeContentSchema }),
  z.object({ type: z.literal("tex"), texSource: texSourceSchema }),
  // Duplicates another resume. With mode "code" on a structured source this ejects it to LaTeX.
  z.object({ type: z.literal("resume"), resumeId: idParam, versionId: idParam.optional() }),
]);

export const createResumeBody = z.object({
  title: z.string().trim().min(1).max(120),
  mode: z.enum(["structured", "code"]).default("structured"),
  templateId: z.string().optional(),
  jobId: idParam.optional(),
  pageLimit: z.number().int().min(1).max(3).default(1),
  source: resumeSource.default({ type: "blank" }),
});

export const updateResumeBody = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    templateId: z.string().optional(),
    jobId: idParam.nullable().optional(),
    pageLimit: z.number().int().min(1).max(3).optional(),
    archived: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const listResumesQuery = z.object({
  archived: z.stringbool().default(false),
});

export const createVersionBody = z.discriminatedUnion("kind", [
  // Autosave or explicit save. A label turns it into a named checkpoint.
  z.object({
    kind: z.literal("manual"),
    content: resumeContentSchema.optional(),
    texSource: texSourceSchema.optional(),
    label: z.string().trim().min(1).max(80).optional(),
    semver: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  }),
  z.object({ kind: z.literal("restore"), fromVersionId: idParam }),
]);

export const updateVersionBody = z
  .object({
    label: z.string().trim().min(1).max(80).nullable().optional(),
    semver: z.string().regex(/^\d+\.\d+\.\d+$/).nullable().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const listVersionsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.date().optional(),
});

export const resumeSummary = z.object({
  id: z.uuid(),
  title: z.string(),
  mode: z.enum(["structured", "code"]),
  templateId: z.string().nullable(),
  jobId: z.uuid().nullable(),
  sourceResumeId: z.uuid().nullable(),
  headVersionId: z.uuid().nullable(),
  pageLimit: z.number().int(),
  archivedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const versionSummary = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable(),
  kind: z.enum(["import", "manual", "ai", "restore", "named"]),
  label: z.string().nullable(),
  semver: z.string().nullable(),
  createdAt: z.date(),
});

export const versionDetail = versionSummary.extend({
  content: resumeContentSchema.nullable(),
  texSource: z.string().nullable(),
});

export const resumeDetail = resumeSummary.extend({ head: versionDetail.nullable() });

export const resumeListResponse = z.array(resumeSummary);
export const versionListResponse = z.array(versionSummary);
