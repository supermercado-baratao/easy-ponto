-- Anonymous Gregorian algorithm, the same as getEasterDate (src/models/holiday/utils.ts)
CREATE FUNCTION pg_temp.easter_date(y integer) RETURNS date LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  a integer := y % 19;
  b integer := y / 100;
  c integer := y % 100;
  h integer;
  l integer;
  m integer;
BEGIN
  h := (19 * a + b - b / 4 - (b - (b + 8) / 25 + 1) / 3 + 15) % 30;
  l := (32 + 2 * (b % 4) + 2 * (c / 4) - h - c % 4) % 7;
  m := (a + 11 * h + 22 * l) / 451;
  RETURN make_date(y, (h + l - 7 * m + 114) / 31, (h + l - 7 * m + 114) % 31 + 1);
END
$$;
--> statement-breakpoint
UPDATE "holidays" SET "recurrence" = 'yearly' WHERE "recurring";
--> statement-breakpoint
-- The national holidays button saved the Easter-based ones with the date of one year (#116), so each becomes one
-- moveable holiday from the first year it was saved in, and the copies of the other years are removed
WITH "matches" AS (
  SELECT "holidays"."id", "holidays"."company_id", "holidays"."created_at", "rules"."easter_offset",
    extract(year FROM "holidays"."date")::integer AS "year"
  FROM "holidays"
  JOIN (VALUES ('Carnaval', -48), ('Carnaval', -47), ('Paixão de Cristo', -2), ('Corpus Christi', 60))
    AS "rules" ("name", "easter_offset")
    ON "holidays"."name" = "rules"."name"
    AND "holidays"."date" = pg_temp.easter_date(extract(year FROM "holidays"."date")::integer) + "rules"."easter_offset"
  WHERE NOT "holidays"."recurring"
), "ranked" AS (
  SELECT *,
    row_number() OVER (PARTITION BY "company_id", "easter_offset" ORDER BY "year", "created_at") AS "position",
    min("year") OVER (PARTITION BY "company_id", "easter_offset") AS "first_year"
  FROM "matches"
), "removed" AS (
  DELETE FROM "holidays" WHERE "id" IN (SELECT "id" FROM "ranked" WHERE "position" > 1)
)
UPDATE "holidays"
SET "recurrence" = 'easter', "easter_offset" = "ranked"."easter_offset", "first_year" = "ranked"."first_year", "date" = NULL
FROM "ranked"
WHERE "holidays"."id" = "ranked"."id" AND "ranked"."position" = 1;
