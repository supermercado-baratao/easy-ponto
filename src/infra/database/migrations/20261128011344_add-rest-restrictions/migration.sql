CREATE TABLE "rest_restriction_users" (
	"id" text PRIMARY KEY,
	"restriction_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "rest_restriction_users_restriction_id_user_id_key" UNIQUE("restriction_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "rest_restrictions" (
	"id" text PRIMARY KEY,
	"kind" text NOT NULL,
	"level" text NOT NULL,
	"max_off" integer,
	"user_group_id" text CONSTRAINT "rest_restrictions_user_group_id_key" UNIQUE,
	"user_id" text CONSTRAINT "rest_restrictions_user_id_key" UNIQUE,
	"weekdays" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "rest_restrictions_kind_check" CHECK (("kind" = 'together' and "max_off" >= 1 and "user_group_id" is null and "user_id" is null)
        or ("kind" = 'group' and "max_off" >= 1 and "user_group_id" is not null and "user_id" is null)
        or ("kind" = 'weekdays' and "max_off" is null and "user_group_id" is null and "user_id" is not null and cardinality("weekdays") between 1 and 6))
);
--> statement-breakpoint
CREATE INDEX "rest_restriction_users_user_id_idx" ON "rest_restriction_users" ("user_id");--> statement-breakpoint
CREATE INDEX "rest_restrictions_company_id_idx" ON "rest_restrictions" ("company_id");--> statement-breakpoint
ALTER TABLE "rest_restriction_users" ADD CONSTRAINT "rest_restriction_users_restriction_id_fkey" FOREIGN KEY ("restriction_id") REFERENCES "rest_restrictions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rest_restriction_users" ADD CONSTRAINT "rest_restriction_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rest_restrictions" ADD CONSTRAINT "rest_restrictions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rest_restrictions" ADD CONSTRAINT "rest_restrictions_user_group_id_fkey" FOREIGN KEY ("user_group_id") REFERENCES "user_groups"("id");--> statement-breakpoint
ALTER TABLE "rest_restrictions" ADD CONSTRAINT "rest_restrictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;