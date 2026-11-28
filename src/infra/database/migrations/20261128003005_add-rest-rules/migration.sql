CREATE TABLE "rest_rule_constraints" (
	"id" text PRIMARY KEY,
	"rest_rule_id" text NOT NULL,
	"constraint" text NOT NULL,
	"level" text NOT NULL,
	"position" integer,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "rest_rule_constraints_rest_rule_id_constraint_key" UNIQUE("rest_rule_id","constraint")
);
--> statement-breakpoint
CREATE TABLE "rest_rule_shift_patterns" (
	"id" text PRIMARY KEY,
	"rest_rule_id" text NOT NULL,
	"shift_pattern_id" text NOT NULL CONSTRAINT "rest_rule_shift_patterns_shift_pattern_id_key" UNIQUE,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rest_rules" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"window_start_day" integer NOT NULL,
	"window_end_day" integer NOT NULL,
	"distances" integer[] NOT NULL,
	"blocked_weekdays" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"holiday_rest" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "rest_rules_window_check" CHECK ("window_start_day" >= 1 and "window_end_day" <= 31 and "window_start_day" <= "window_end_day")
);
--> statement-breakpoint
CREATE INDEX "rest_rule_shift_patterns_rest_rule_id_idx" ON "rest_rule_shift_patterns" ("rest_rule_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rest_rules_company_id_name_key" ON "rest_rules" ("company_id",lower("name"));--> statement-breakpoint
CREATE INDEX "rest_rules_company_id_idx" ON "rest_rules" ("company_id");--> statement-breakpoint
ALTER TABLE "rest_rule_constraints" ADD CONSTRAINT "rest_rule_constraints_rest_rule_id_fkey" FOREIGN KEY ("rest_rule_id") REFERENCES "rest_rules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rest_rule_shift_patterns" ADD CONSTRAINT "rest_rule_shift_patterns_rest_rule_id_fkey" FOREIGN KEY ("rest_rule_id") REFERENCES "rest_rules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rest_rule_shift_patterns" ADD CONSTRAINT "rest_rule_shift_patterns_shift_pattern_id_fkey" FOREIGN KEY ("shift_pattern_id") REFERENCES "shift_patterns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rest_rules" ADD CONSTRAINT "rest_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;