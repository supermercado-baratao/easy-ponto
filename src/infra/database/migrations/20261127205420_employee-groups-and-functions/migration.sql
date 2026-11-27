CREATE TABLE "job_functions" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "job_functions_level_check" CHECK ("level" >= 1)
);
--> statement-breakpoint
CREATE TABLE "user_group_members" (
	"id" text PRIMARY KEY,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "user_group_members_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_groups" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"parent_id" text,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_job_functions" (
	"id" text PRIMARY KEY,
	"active" boolean DEFAULT true NOT NULL,
	"job_function_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "user_job_functions_user_id_job_function_id_key" UNIQUE("user_id","job_function_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payroll_position_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "job_functions_company_id_name_key" ON "job_functions" ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "job_functions_company_id_idx" ON "job_functions" ("company_id");--> statement-breakpoint
CREATE INDEX "user_group_members_user_id_idx" ON "user_group_members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_groups_company_id_name_key" ON "user_groups" ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "user_groups_company_id_idx" ON "user_groups" ("company_id");--> statement-breakpoint
CREATE INDEX "user_groups_parent_id_idx" ON "user_groups" ("parent_id");--> statement-breakpoint
CREATE INDEX "user_job_functions_job_function_id_idx" ON "user_job_functions" ("job_function_id");--> statement-breakpoint
ALTER TABLE "job_functions" ADD CONSTRAINT "job_functions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "user_groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_groups" ADD CONSTRAINT "user_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "user_groups"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_job_functions" ADD CONSTRAINT "user_job_functions_job_function_id_fkey" FOREIGN KEY ("job_function_id") REFERENCES "job_functions"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "user_job_functions" ADD CONSTRAINT "user_job_functions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;