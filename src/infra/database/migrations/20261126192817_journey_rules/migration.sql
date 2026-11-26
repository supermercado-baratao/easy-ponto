CREATE TABLE "journey_rules" (
	"id" text PRIMARY KEY,
	"punch_tolerance" integer NOT NULL,
	"daily_tolerance" integer NOT NULL,
	"max_lunch" integer NOT NULL,
	"max_daily_journey" integer NOT NULL,
	"max_continuous_work" integer NOT NULL,
	"company_id" text NOT NULL CONSTRAINT "journey_rules_company_id_key" UNIQUE,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_bands" (
	"id" text PRIMARY KEY,
	"day_kind" text NOT NULL,
	"up_to" integer,
	"percentage" integer NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "overtime_bands_company_id_day_kind_up_to_key" UNIQUE NULLS NOT DISTINCT("company_id","day_kind","up_to")
);
--> statement-breakpoint
CREATE INDEX "overtime_bands_company_id_idx" ON "overtime_bands" ("company_id");--> statement-breakpoint
ALTER TABLE "journey_rules" ADD CONSTRAINT "journey_rules_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "overtime_bands" ADD CONSTRAINT "overtime_bands_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;