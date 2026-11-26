CREATE TABLE "shift_adjustments" (
	"id" text PRIMARY KEY,
	"date" date NOT NULL,
	"kind" text NOT NULL,
	"entry_1" integer,
	"exit_1" integer,
	"entry_2" integer,
	"exit_2" integer,
	"entry_3" integer,
	"exit_3" integer,
	"user_id" text NOT NULL,
	"shift_assignment_id" text,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL,
	CONSTRAINT "shift_adjustments_user_id_date_key" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "shift_assignments" (
	"id" text PRIMARY KEY,
	"start_date" date NOT NULL,
	"end_date" date,
	"cycle_start_day" integer NOT NULL,
	"user_id" text NOT NULL,
	"shift_pattern_id" text NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "shift_adjustments_shift_assignment_id_idx" ON "shift_adjustments" ("shift_assignment_id");--> statement-breakpoint
CREATE INDEX "shift_assignments_user_id_idx" ON "shift_assignments" ("user_id");--> statement-breakpoint
CREATE INDEX "shift_assignments_shift_pattern_id_idx" ON "shift_assignments" ("shift_pattern_id");--> statement-breakpoint
ALTER TABLE "shift_adjustments" ADD CONSTRAINT "shift_adjustments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_adjustments" ADD CONSTRAINT "shift_adjustments_shift_assignment_id_fkey" FOREIGN KEY ("shift_assignment_id") REFERENCES "shift_assignments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_pattern_id_fkey" FOREIGN KEY ("shift_pattern_id") REFERENCES "shift_patterns"("id") ON DELETE RESTRICT;