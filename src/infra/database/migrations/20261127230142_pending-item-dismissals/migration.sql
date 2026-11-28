CREATE TABLE "pending_item_dismissals" (
	"id" text PRIMARY KEY,
	"key" text NOT NULL,
	"company_id" text NOT NULL,
	"dismissed_by_id" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "pending_item_dismissals_company_id_key_key" UNIQUE("company_id","key")
);
--> statement-breakpoint
ALTER TABLE "pending_item_dismissals" ADD CONSTRAINT "pending_item_dismissals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pending_item_dismissals" ADD CONSTRAINT "pending_item_dismissals_dismissed_by_id_fkey" FOREIGN KEY ("dismissed_by_id") REFERENCES "auth_users"("id") ON DELETE SET NULL;