ALTER TABLE "holidays" DROP CONSTRAINT "holidays_company_id_date_key";--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "recurrence" text DEFAULT 'once' NOT NULL;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "easter_offset" integer;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "first_year" integer;--> statement-breakpoint
ALTER TABLE "holidays" ADD COLUMN "last_year" integer;--> statement-breakpoint
ALTER TABLE "holidays" ALTER COLUMN "date" DROP NOT NULL;