CREATE TYPE "public"."ai_provider" AS ENUM('openai', 'anthropic', 'openrouter');--> statement-breakpoint
CREATE TABLE "user_ai_keys" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"provider" "ai_provider" NOT NULL,
	"model_id" text,
	"encrypted_key" text NOT NULL,
	"key_hint" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_runs" ADD COLUMN "byok" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_ai_keys" ADD CONSTRAINT "user_ai_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;