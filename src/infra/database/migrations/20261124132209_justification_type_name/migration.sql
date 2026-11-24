ALTER TABLE "justification_types" RENAME COLUMN "description" TO "name";--> statement-breakpoint
ALTER TABLE "justification_types" DROP CONSTRAINT "justification_types_company_id_code_key";--> statement-breakpoint
ALTER TABLE "justification_types" DROP COLUMN "code";--> statement-breakpoint
CREATE UNIQUE INDEX "justification_types_company_id_name_key" ON "justification_types" ("company_id",lower("name"));