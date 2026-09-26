import { z } from "zod";

// Treats empty values like `KEY=` in .env as unset.
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().trim().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  DATABASE_URL: z.url(),
  FRONTEND_URL: z.url().default("http://localhost:3000"),

  AI_PROVIDER: z.enum(["openai", "anthropic", "openrouter"]).default("openai"),
  AI_MODEL_FAST: optionalString,
  AI_MODEL_SMART: optionalString,
  OPENAI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  OPENROUTER_API_KEY: optionalString,

  RESEND_API_KEY: optionalString,
  EMAIL_FROM: z.string().default("Resume Builder <onboarding@resend.dev>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
