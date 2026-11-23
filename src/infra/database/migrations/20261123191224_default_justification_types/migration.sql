-- The default types of src/models/justification-type/utils.ts for the companies created before them (#98)
INSERT INTO "justification_types" ("id", "code", "description", "effect", "company_id", "updated_at")
SELECT gen_random_uuid()::text, "types"."code", "types"."description", "types"."effect", "companies"."id", now()
FROM "companies"
CROSS JOIN (
	VALUES
		('COMPENSACAO', 'Compensação', 'deduct'),
		('ABONO', 'Abono', 'excuse'),
		('ATESTADO', 'Atestado médico', 'excuse'),
		('AUSENCIA LEGAL', 'Ausência legal', 'excuse'),
		('FERIAS', 'Férias', 'excuse'),
		('LICENCA', 'Licença', 'excuse')
) AS "types" ("code", "description", "effect")
ON CONFLICT ("company_id", "code") DO NOTHING;
