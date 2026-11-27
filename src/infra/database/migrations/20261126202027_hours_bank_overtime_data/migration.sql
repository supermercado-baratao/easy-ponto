-- The overtime saved before the bands (#108) was split into 60% and 100%, which become those two percentages
UPDATE "hours_bank_balances"
SET "overtime" = (
  SELECT coalesce(jsonb_agg(jsonb_build_object('percentage', "percentage", 'minutes', "minutes") ORDER BY "percentage"), '[]'::jsonb)
  FROM (VALUES (60, "overtime_60"), (100, "overtime_100")) AS "totals" ("percentage", "minutes")
  WHERE "minutes" <> 0
);
