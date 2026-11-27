ALTER TABLE "holidays" DROP COLUMN "recurring";--> statement-breakpoint
ALTER TABLE "holidays" ALTER COLUMN "recurrence" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_recurrence_check" CHECK (("recurrence" = 'once' AND "date" IS NOT NULL AND "easter_offset" IS NULL AND "first_year" IS NULL AND "last_year" IS NULL)
        OR ("recurrence" = 'yearly' AND "date" IS NOT NULL AND "easter_offset" IS NULL)
        OR ("recurrence" = 'easter' AND "date" IS NULL AND "easter_offset" IS NOT NULL));