CREATE TABLE "justification_code_mappings" (
	"id" text PRIMARY KEY,
	"format" text NOT NULL,
	"code" text NOT NULL,
	"company_id" text NOT NULL,
	"type_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "justification_code_mappings_company_id_format_code_key" UNIQUE("company_id","format","code")
);
--> statement-breakpoint
ALTER TABLE "hours_bank_balances" RENAME COLUMN "day_off" TO "compensation";--> statement-breakpoint
CREATE INDEX "justification_code_mappings_type_id_idx_907568e1" ON "justification_code_mappings" ("type_id");--> statement-breakpoint
ALTER TABLE "justification_code_mappings" ADD CONSTRAINT "justification_code_mappings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "justification_code_mappings" ADD CONSTRAINT "justification_code_mappings_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "justification_types"("id") ON DELETE CASCADE;