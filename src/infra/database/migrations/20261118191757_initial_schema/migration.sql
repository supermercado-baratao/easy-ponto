CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY,
	"companyId" text,
	"deviceCredentialsId" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"cpf" text NOT NULL,
	"tipo_doc" integer NOT NULL,
	"cpf_cnpj" text NOT NULL CONSTRAINT "companies_cpf_cnpj_key" UNIQUE,
	"cei" text NOT NULL,
	"registration" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices_credentials" (
	"id" text PRIMARY KEY,
	"ip" text NOT NULL,
	"login" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices_sessions" (
	"id" text PRIMARY KEY,
	"token" text NOT NULL,
	"deviceCredentialsId" text NOT NULL CONSTRAINT "devices_sessions_deviceCredentialsId_key" UNIQUE,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"id" text PRIMARY KEY,
	"date" date NOT NULL,
	"name" text NOT NULL,
	"scope" text NOT NULL,
	"recurring" boolean NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "holidays_company_id_date_key" UNIQUE("company_id","date")
);
--> statement-breakpoint
CREATE TABLE "hours_bank_adjustments" (
	"id" text PRIMARY KEY,
	"date" date NOT NULL,
	"minutes" integer NOT NULL,
	"reason" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hours_bank_balances" (
	"id" text PRIMARY KEY,
	"previous_balance" integer NOT NULL,
	"absence" integer NOT NULL,
	"lateness" integer NOT NULL,
	"day_off" integer NOT NULL,
	"overtime_60" integer NOT NULL,
	"overtime_100" integer NOT NULL,
	"adjustment" integer NOT NULL,
	"balance" integer NOT NULL,
	"closing_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "hours_bank_balances_closing_id_user_id_key" UNIQUE("closing_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "hours_bank_closings" (
	"id" text PRIMARY KEY,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"initial" boolean DEFAULT false NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "hours_bank_closings_company_id_end_date_key" UNIQUE("company_id","end_date")
);
--> statement-breakpoint
CREATE TABLE "justification_types" (
	"id" text PRIMARY KEY,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"effect" text NOT NULL,
	"company_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "justification_types_company_id_code_key" UNIQUE("company_id","code")
);
--> statement-breakpoint
CREATE TABLE "justifications" (
	"id" text PRIMARY KEY,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"start_time" integer,
	"end_time" integer,
	"note" text,
	"user_id" text NOT NULL,
	"type_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "punch_records" (
	"id" text PRIMARY KEY,
	"pis" text NOT NULL,
	"datetime" timestamp(3) with time zone NOT NULL,
	"afd_datetime" timestamp(3) with time zone,
	"nsr" integer CONSTRAINT "punch_records_nsr_key" UNIQUE,
	"registration_type" text,
	"hexadecimal_check_digit" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" text PRIMARY KEY,
	"start_date" date NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "schedules_user_id_start_date_key" UNIQUE("user_id","start_date")
);
--> statement-breakpoint
CREATE TABLE "schedules_days" (
	"id" text PRIMARY KEY,
	"weekday" integer NOT NULL,
	"entry_1" integer,
	"exit_1" integer,
	"entry_2" integer,
	"exit_2" integer,
	"entry_3" integer,
	"exit_3" integer,
	"schedule_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "schedules_days_schedule_id_weekday_key" UNIQUE("schedule_id","weekday")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"pis" text NOT NULL CONSTRAINT "users_pis_key" UNIQUE,
	"cpf" text,
	"code" text NOT NULL,
	"templates_count" integer NOT NULL,
	"password" text NOT NULL,
	"rfid" text NOT NULL,
	"bars" text NOT NULL,
	"registration" text NOT NULL,
	"payroll_number" text,
	"admission_date" timestamp(3) with time zone,
	"position" text,
	"department" text,
	"status" text DEFAULT 'registered' NOT NULL,
	"companyId" text NOT NULL,
	"admin_user_id" text CONSTRAINT "users_admin_user_id_key" UNIQUE,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacation_plans" (
	"id" text PRIMARY KEY,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"user_id" text NOT NULL,
	"justification_id" text CONSTRAINT "vacation_plans_justification_id_key" UNIQUE,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "vacation_plans_user_id_year_key" UNIQUE("user_id","year")
);
--> statement-breakpoint
CREATE INDEX "admin_users_companyId_idx_33acc5ed" ON "admin_users" ("companyId");--> statement-breakpoint
CREATE INDEX "admin_users_deviceCredentialsId_idx_c948dafc" ON "admin_users" ("deviceCredentialsId");--> statement-breakpoint
CREATE INDEX "holidays_company_id_idx_1303a718" ON "holidays" ("company_id");--> statement-breakpoint
CREATE INDEX "hours_bank_adjustments_user_id_idx_6c952402" ON "hours_bank_adjustments" ("user_id");--> statement-breakpoint
CREATE INDEX "hours_bank_balances_closing_id_idx_67d1d3e9" ON "hours_bank_balances" ("closing_id");--> statement-breakpoint
CREATE INDEX "hours_bank_balances_user_id_idx_6c952402" ON "hours_bank_balances" ("user_id");--> statement-breakpoint
CREATE INDEX "hours_bank_closings_company_id_idx_1303a718" ON "hours_bank_closings" ("company_id");--> statement-breakpoint
CREATE INDEX "justification_types_company_id_idx_1303a718" ON "justification_types" ("company_id");--> statement-breakpoint
CREATE INDEX "justifications_user_id_idx_6c952402" ON "justifications" ("user_id");--> statement-breakpoint
CREATE INDEX "justifications_type_id_idx_907568e1" ON "justifications" ("type_id");--> statement-breakpoint
CREATE INDEX "punch_records_pis_idx_b1390a89" ON "punch_records" ("pis");--> statement-breakpoint
CREATE INDEX "schedules_user_id_idx_6c952402" ON "schedules" ("user_id");--> statement-breakpoint
CREATE INDEX "schedules_days_schedule_id_idx_83757f9e" ON "schedules_days" ("schedule_id");--> statement-breakpoint
CREATE INDEX "users_companyId_idx_33acc5ed" ON "users" ("companyId");--> statement-breakpoint
CREATE INDEX "vacation_plans_user_id_idx_6c952402" ON "vacation_plans" ("user_id");--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id");--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_deviceCredentialsId_fkey" FOREIGN KEY ("deviceCredentialsId") REFERENCES "devices_credentials"("id");--> statement-breakpoint
ALTER TABLE "devices_sessions" ADD CONSTRAINT "devices_sessions_deviceCredentialsId_fkey" FOREIGN KEY ("deviceCredentialsId") REFERENCES "devices_credentials"("id");--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hours_bank_adjustments" ADD CONSTRAINT "hours_bank_adjustments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hours_bank_balances" ADD CONSTRAINT "hours_bank_balances_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "hours_bank_closings"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hours_bank_balances" ADD CONSTRAINT "hours_bank_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hours_bank_closings" ADD CONSTRAINT "hours_bank_closings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "justification_types" ADD CONSTRAINT "justification_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "justifications" ADD CONSTRAINT "justifications_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "justification_types"("id");--> statement-breakpoint
ALTER TABLE "punch_records" ADD CONSTRAINT "punch_records_pis_fkey" FOREIGN KEY ("pis") REFERENCES "users"("pis");--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "schedules_days" ADD CONSTRAINT "schedules_days_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id");--> statement-breakpoint
ALTER TABLE "vacation_plans" ADD CONSTRAINT "vacation_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vacation_plans" ADD CONSTRAINT "vacation_plans_justification_id_fkey" FOREIGN KEY ("justification_id") REFERENCES "justifications"("id") ON DELETE SET NULL;