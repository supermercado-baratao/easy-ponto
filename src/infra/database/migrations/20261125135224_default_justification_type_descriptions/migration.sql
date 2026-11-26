-- The descriptions of the default types of src/models/justification-type/utils.ts for the companies created before them (#103)
UPDATE "justification_types"
SET "description" = "defaults"."description", "updated_at" = now()
FROM (
	VALUES
		('Compensação', 'Folga paga com as horas do banco de horas. O tempo da ausência é descontado do saldo do funcionário. Use quando ele deixa de trabalhar em um dia ou turno para compensar horas extras.'),
		('Abono', 'Ausência perdoada pela empresa, sem desconto no banco de horas, quando a lei não garante o direito. Por exemplo, o falecimento de um parente distante ou uma liberação mais cedo. Escreva o motivo na observação da justificativa.'),
		('Atestado médico', 'Ausência por doença ou consulta, comprovada por atestado médico ou odontológico. Não desconta do banco de horas.'),
		('Ausência legal', 'Faltas permitidas por lei sem desconto, como casamento, falecimento de cônjuge, pais, avós, filhos, netos, irmãos ou dependente, doação de sangue ou comparecimento à Justiça (art. 473 da CLT). Use com o comprovante. Ausências fora desses casos são abono.'),
		('Férias', 'Período de férias do funcionário. Não desconta do banco de horas. É criada ao registrar as férias planejadas em Férias.'),
		('Licença', 'Afastamentos longos previstos em lei, como licença-maternidade, licença-paternidade ou afastamento pelo INSS. Não desconta do banco de horas.')
) AS "defaults" ("name", "description")
WHERE lower("justification_types"."name") = lower("defaults"."name")
	AND "justification_types"."description" IS NULL;
