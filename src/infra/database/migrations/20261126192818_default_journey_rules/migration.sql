-- The CLT values of DEFAULT_JOURNEY_RULES (src/models/journey-rules/utils.ts) for the companies created before the rules (#105)
INSERT INTO "journey_rules" ("id", "punch_tolerance", "daily_tolerance", "max_lunch", "max_daily_journey", "max_continuous_work", "company_id", "updated_at")
SELECT gen_random_uuid()::text, 5, 10, 120, 480, 360, "id", now()
FROM "companies"
ON CONFLICT ("company_id") DO NOTHING;
