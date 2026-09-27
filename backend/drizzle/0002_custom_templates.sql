CREATE TABLE "custom_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mode" "resume_mode" NOT NULL,
	"template_id" text,
	"content" jsonb,
	"tex_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_templates_body_matches_mode" CHECK (("custom_templates"."mode" = 'structured' AND "custom_templates"."content" IS NOT NULL) OR ("custom_templates"."mode" = 'code' AND "custom_templates"."tex_source" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "custom_templates" ADD CONSTRAINT "custom_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_templates" ADD CONSTRAINT "custom_templates_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "custom_templates_user_id_index" ON "custom_templates" USING btree ("user_id");