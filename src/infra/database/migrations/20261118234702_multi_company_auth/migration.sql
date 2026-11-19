CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp(3) with time zone,
	"refresh_token_expires_at" timestamp(3) with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY,
	"token" text NOT NULL CONSTRAINT "auth_sessions_token_key" UNIQUE,
	"expires_at" timestamp(3) with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_company_id" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "auth_users_email_key" UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_verifications" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp(3) with time zone NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp(3) with time zone NOT NULL,
	"company_id" text NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY,
	"role" text NOT NULL,
	"company_id" text NOT NULL,
	"auth_user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_company_id_auth_user_id_key" UNIQUE("company_id","auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "punch_records" DROP CONSTRAINT "punch_records_pis_fkey";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_admin_user_id_fkey";--> statement-breakpoint
DROP TABLE "admin_users";--> statement-breakpoint
ALTER TABLE "punch_records" DROP CONSTRAINT "punch_records_nsr_key";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_pis_key";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_admin_user_id_key";--> statement-breakpoint
DROP INDEX "punch_records_pis_idx_b1390a89";--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "device_credentials_id" text;--> statement-breakpoint
ALTER TABLE "punch_records" ADD COLUMN "company_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_user_id" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "admin_user_id";--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "cpf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "tipo_doc" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "cpf_cnpj" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "cei" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_slug_key" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_device_credentials_id_key" UNIQUE("device_credentials_id");--> statement-breakpoint
ALTER TABLE "punch_records" ADD CONSTRAINT "punch_records_company_id_nsr_key" UNIQUE("company_id","nsr");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_pis_key" UNIQUE("companyId","pis");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_auth_user_id_key" UNIQUE("companyId","auth_user_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications" ("identifier");--> statement-breakpoint
CREATE INDEX "invitations_company_id_idx" ON "invitations" ("company_id");--> statement-breakpoint
CREATE INDEX "members_auth_user_id_idx" ON "members" ("auth_user_id");--> statement-breakpoint
CREATE INDEX "punch_records_company_id_pis_idx" ON "punch_records" ("company_id","pis");--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_active_company_id_fkey" FOREIGN KEY ("active_company_id") REFERENCES "companies"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_device_credentials_id_fkey" FOREIGN KEY ("device_credentials_id") REFERENCES "devices_credentials"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "punch_records" ADD CONSTRAINT "punch_records_company_id_pis_fkey" FOREIGN KEY ("company_id","pis") REFERENCES "users"("companyId","pis") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth_users"("id") ON DELETE SET NULL;