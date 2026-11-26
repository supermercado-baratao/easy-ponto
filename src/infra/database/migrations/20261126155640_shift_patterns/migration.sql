CREATE TABLE "shift_pattern_version_days" (
	"id" text PRIMARY KEY,
	"cycle_day" integer NOT NULL,
	"entry_1" integer,
	"exit_1" integer,
	"entry_2" integer,
	"exit_2" integer,
	"entry_3" integer,
	"exit_3" integer,
	"version_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "shift_pattern_version_days_version_id_cycle_day_key" UNIQUE("version_id","cycle_day")
);
--> statement-breakpoint
CREATE TABLE "shift_pattern_versions" (
	"id" text PRIMARY KEY,
	"start_date" date NOT NULL,
	"cycle_length" integer NOT NULL,
	"shift_pattern_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "shift_pattern_versions_shift_pattern_id_start_date_key" UNIQUE("shift_pattern_id","start_date")
);
--> statement-breakpoint
CREATE TABLE "shift_patterns" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shift_pattern_version_days_version_id_idx" ON "shift_pattern_version_days" ("version_id");--> statement-breakpoint
CREATE INDEX "shift_pattern_versions_shift_pattern_id_idx" ON "shift_pattern_versions" ("shift_pattern_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shift_patterns_company_id_name_key" ON "shift_patterns" ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "shift_patterns_company_id_idx" ON "shift_patterns" ("company_id");--> statement-breakpoint
ALTER TABLE "shift_pattern_version_days" ADD CONSTRAINT "shift_pattern_version_days_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "shift_pattern_versions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_pattern_versions" ADD CONSTRAINT "shift_pattern_versions_shift_pattern_id_fkey" FOREIGN KEY ("shift_pattern_id") REFERENCES "shift_patterns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_patterns" ADD CONSTRAINT "shift_patterns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;