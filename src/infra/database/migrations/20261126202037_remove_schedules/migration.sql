ALTER TABLE "schedules_days" DROP CONSTRAINT "schedules_days_schedule_id_fkey";--> statement-breakpoint
DROP TABLE "schedules";--> statement-breakpoint
DROP TABLE "schedules_days";--> statement-breakpoint
ALTER TABLE "hours_bank_balances" DROP COLUMN "overtime_60";--> statement-breakpoint
ALTER TABLE "hours_bank_balances" DROP COLUMN "overtime_100";--> statement-breakpoint
ALTER TABLE "hours_bank_balances" ALTER COLUMN "overtime" SET NOT NULL;