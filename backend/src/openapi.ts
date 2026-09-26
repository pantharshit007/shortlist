import { z } from "zod";
import { createDocument, type ZodOpenApiOperationObject, type ZodOpenApiPathsObject } from "zod-openapi";
import { checkoutResponse, createCheckoutBody, subscriptionResponse } from "./modules/billing/billing.schemas.js";
import { createImportBody, importResponse } from "./modules/imports/imports.schemas.js";
import { createJobBody, jobListResponse, jobParams, jobResponse } from "./modules/jobs/jobs.schemas.js";
import { createPreviewBody, resumePdfQuery } from "./modules/pdfs/pdfs.schemas.js";
import { profileResponse, putProfileBody } from "./modules/profiles/profiles.schemas.js";
import {
  publicProfileResponse,
  publicResumeParams,
  publicResumeResponse,
  publicUserParams,
} from "./modules/public/public.schemas.js";
import {
  createResumeBody,
  createVersionBody,
  listResumesQuery,
  listVersionsQuery,
  resumeDetail,
  resumeListResponse,
  resumeParams,
  resumeSummary,
  updateResumeBody,
  updateVersionBody,
  versionDetail,
  versionListResponse,
  versionParams,
} from "./modules/resumes/resumes.schemas.js";
import {
  createShareLinkBody,
  shareLinkListResponse,
  shareLinkParams,
  shareLinkResponse,
  shareLinkStatsResponse,
  updateShareLinkBody,
} from "./modules/share-links/share-links.schemas.js";
import {
  createSuggestionBody,
  suggestionListResponse,
  suggestionParams,
  suggestionResponse,
} from "./modules/suggestions/suggestions.schemas.js";
import { templateListResponse } from "./modules/templates/templates.schemas.js";
import { uploadParams, uploadResponse } from "./modules/uploads/uploads.schemas.js";
import { meResponse, updateMeBody, usernameParams, usernameResponse } from "./modules/users/users.schemas.js";

const errorResponse = z
  .object({
    error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
  })
  .meta({ id: "Error" });

const usageCounter = z.object({ used: z.number().int(), limit: z.number().int() });
const usageResponse = z.object({
  plan: z.enum(["free", "season_pass", "pro"]),
  periodStart: z.date(),
  periodEnd: z.date(),
  resumes: usageCounter,
  tailor: usageCounter,
  edit: usageCounter,
  import: usageCounter,
});

type OperationInput = {
  summary: string;
  tag: string;
  auth?: boolean;
  params?: z.ZodObject;
  query?: z.ZodObject;
  headers?: z.ZodObject;
  body?: z.ZodType;
  multipart?: z.ZodType;
  response?: z.ZodType;
  status?: 200 | 201;
  pdf?: boolean;
  noContent?: boolean;
};

function op(input: OperationInput): ZodOpenApiOperationObject {
  const success = input.noContent
    ? { 204: { description: "No content" } }
    : input.pdf
      ? { 200: { description: "PDF", content: { "application/pdf": { schema: z.string().meta({ format: "binary" }) } } } }
      : {
          [input.status ?? 200]: {
            description: "OK",
            content: { "application/json": { schema: z.object({ data: input.response ?? z.unknown() }) } },
          },
        };

  return {
    summary: input.summary,
    tags: [input.tag],
    ...(input.auth !== false && { security: [{ session: [] }] }),
    ...((input.params || input.query || input.headers) && {
      requestParams: {
        ...(input.params && { path: input.params }),
        ...(input.query && { query: input.query }),
        ...(input.headers && { header: input.headers }),
      },
    }),
    ...(input.body && { requestBody: { content: { "application/json": { schema: input.body } } } }),
    ...(input.multipart && { requestBody: { content: { "multipart/form-data": { schema: input.multipart } } } }),
    responses: {
      ...success,
      default: { description: "Error", content: { "application/json": { schema: errorResponse } } },
    },
  };
}

const sharePassword = z.object({ "x-share-password": z.string().optional() });

const paths: ZodOpenApiPathsObject = {
  "/v1/me": {
    get: op({ summary: "Get the signed-in user", tag: "Account", response: meResponse }),
    patch: op({ summary: "Update name or username", tag: "Account", body: updateMeBody, response: meResponse }),
    delete: op({ summary: "Delete the account and all data", tag: "Account", noContent: true }),
  },
  "/v1/me/data": { get: op({ summary: "Export all of my data", tag: "Account" }) },
  "/v1/usernames/{username}": {
    get: op({ summary: "Check username availability", tag: "Account", auth: false, params: usernameParams, response: usernameResponse }),
  },
  "/v1/usage": { get: op({ summary: "Plan limits and usage this month", tag: "Account", response: usageResponse }) },

  "/v1/profile": {
    get: op({ summary: "Get the master profile", tag: "Profile", response: profileResponse }),
    put: op({ summary: "Replace the master profile", tag: "Profile", body: putProfileBody, response: profileResponse }),
  },
  "/v1/templates": { get: op({ summary: "List templates", tag: "Templates", auth: false, response: templateListResponse }) },

  "/v1/resumes": {
    get: op({ summary: "List resumes", tag: "Resumes", query: listResumesQuery, response: resumeListResponse }),
    post: op({ summary: "Create a resume", tag: "Resumes", body: createResumeBody, response: resumeDetail, status: 201 }),
  },
  "/v1/resumes/{resumeId}": {
    get: op({ summary: "Get a resume with its latest version", tag: "Resumes", params: resumeParams, response: resumeDetail }),
    patch: op({ summary: "Update a resume", tag: "Resumes", params: resumeParams, body: updateResumeBody, response: resumeSummary }),
    delete: op({ summary: "Delete a resume (recoverable for 30 days)", tag: "Resumes", params: resumeParams, noContent: true }),
  },
  "/v1/resumes/{resumeId}/versions": {
    get: op({ summary: "List versions", tag: "Versions", params: resumeParams, query: listVersionsQuery, response: versionListResponse }),
    post: op({
      summary: "Save, restore, or apply an AI suggestion as a new version",
      tag: "Versions",
      params: resumeParams,
      body: createVersionBody,
      response: versionDetail,
      status: 201,
    }),
  },
  "/v1/resumes/{resumeId}/versions/{versionId}": {
    get: op({ summary: "Get a version", tag: "Versions", params: versionParams, response: versionDetail }),
    patch: op({ summary: "Label a version", tag: "Versions", params: versionParams, body: updateVersionBody, response: versionDetail }),
  },
  "/v1/resumes/{resumeId}/pdf": {
    get: op({ summary: "Compile a resume version to PDF", tag: "PDFs", params: resumeParams, query: resumePdfQuery, pdf: true }),
  },
  "/v1/previews": { post: op({ summary: "Compile unsaved content to PDF", tag: "PDFs", body: createPreviewBody, pdf: true }) },

  "/v1/uploads": {
    post: op({
      summary: "Upload a resume file (PDF, .tex or .txt, max 5 MB)",
      tag: "Import",
      multipart: z.object({ file: z.string().meta({ format: "binary" }) }),
      response: uploadResponse,
      status: 201,
    }),
  },
  "/v1/uploads/{uploadId}": {
    get: op({ summary: "Get an upload", tag: "Import", params: uploadParams, response: uploadResponse }),
    delete: op({ summary: "Delete an upload", tag: "Import", params: uploadParams, noContent: true }),
  },
  "/v1/imports": {
    post: op({ summary: "Extract resume content from an upload or text", tag: "Import", body: createImportBody, response: importResponse, status: 201 }),
  },

  "/v1/jobs": {
    get: op({ summary: "List jobs", tag: "Jobs", response: jobListResponse }),
    post: op({ summary: "Add a job from text or URL", tag: "Jobs", body: createJobBody, response: jobResponse, status: 201 }),
  },
  "/v1/jobs/{jobId}": {
    get: op({ summary: "Get a job", tag: "Jobs", params: jobParams, response: jobResponse }),
    delete: op({ summary: "Delete a job", tag: "Jobs", params: jobParams, noContent: true }),
  },

  "/v1/resumes/{resumeId}/suggestions": {
    get: op({ summary: "List AI suggestions", tag: "Suggestions", params: resumeParams, response: suggestionListResponse }),
    post: op({
      summary: "Ask the AI to tailor, edit or fix a resume",
      tag: "Suggestions",
      params: resumeParams,
      body: createSuggestionBody,
      response: suggestionResponse,
      status: 201,
    }),
  },
  "/v1/resumes/{resumeId}/suggestions/{suggestionId}": {
    get: op({ summary: "Get an AI suggestion", tag: "Suggestions", params: suggestionParams, response: suggestionResponse }),
  },

  "/v1/resumes/{resumeId}/share-links": {
    get: op({ summary: "List share links", tag: "Sharing", params: resumeParams, response: shareLinkListResponse }),
    post: op({ summary: "Create a share link", tag: "Sharing", params: resumeParams, body: createShareLinkBody, response: shareLinkResponse, status: 201 }),
  },
  "/v1/share-links/{shareLinkId}": {
    get: op({ summary: "Get a share link", tag: "Sharing", params: shareLinkParams, response: shareLinkResponse }),
    patch: op({ summary: "Update a share link", tag: "Sharing", params: shareLinkParams, body: updateShareLinkBody, response: shareLinkResponse }),
    delete: op({ summary: "Delete a share link", tag: "Sharing", params: shareLinkParams, noContent: true }),
  },
  "/v1/share-links/{shareLinkId}/stats": {
    get: op({ summary: "View statistics for a share link", tag: "Sharing", params: shareLinkParams, response: shareLinkStatsResponse }),
  },

  "/v1/public/users/{username}": {
    get: op({ summary: "Public profile with listed resumes", tag: "Public", auth: false, params: publicUserParams, response: publicProfileResponse }),
  },
  "/v1/public/users/{username}/resumes/{slug}": {
    get: op({
      summary: "Public resume (records a view)",
      tag: "Public",
      auth: false,
      params: publicResumeParams,
      headers: sharePassword,
      response: publicResumeResponse,
    }),
  },
  "/v1/public/users/{username}/resumes/{slug}/pdf": {
    get: op({ summary: "Public resume PDF", tag: "Public", auth: false, params: publicResumeParams, headers: sharePassword, pdf: true }),
  },

  "/v1/checkouts": {
    post: op({ summary: "Start a Razorpay checkout", tag: "Billing", body: createCheckoutBody, response: checkoutResponse, status: 201 }),
  },
  "/v1/subscription": {
    get: op({ summary: "Current plan and subscription", tag: "Billing", response: subscriptionResponse }),
    delete: op({ summary: "Cancel Pro at the end of the billing period", tag: "Billing", response: subscriptionResponse }),
  },
};

export function buildOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "Resume Builder API",
      version: "1.0.0",
      description: "Authentication endpoints live under /api/auth (Better Auth). All other endpoints use the session cookie it sets.",
    },
    components: {
      securitySchemes: { session: { type: "apiKey", in: "cookie", name: "better-auth.session_token" } },
    },
    paths,
  });
}
