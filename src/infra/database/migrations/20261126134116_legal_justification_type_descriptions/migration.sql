-- Only the descriptions still equal to the earlier default text, so a description edited by the company is kept (#103)
UPDATE "justification_types"
SET "description" = "defaults"."description", "updated_at" = now()
FROM (
	VALUES
		('Atestado médico', 'Ausência por doença ou consulta, comprovada por atestado médico ou odontológico. Não desconta do banco de horas.', 'Ausência por doença, comprovada por atestado médico ou odontológico que afasta o funcionário do trabalho, por dias ou horas. Não desconta do banco de horas. A declaração de comparecimento, que só informa o horário em que ele esteve na consulta, não é atestado.'),
		('Ausência legal', 'Faltas permitidas por lei sem desconto, como casamento, falecimento de cônjuge, pais, avós, filhos, netos, irmãos ou dependente, doação de sangue ou comparecimento à Justiça (art. 473 da CLT). Use com o comprovante. Ausências fora desses casos são abono.', 'Faltas permitidas por lei sem desconto (art. 473 da CLT), como casamento, falecimento de cônjuge, pais, avós, filhos, netos, irmãos ou dependente, doação de sangue, comparecimento à Justiça, até 2 dias para acompanhar consultas e exames da esposa ou companheira grávida, 1 dia por ano para acompanhar filho de até 6 anos em consulta médica e até 3 dias a cada 12 meses para exames preventivos de câncer. Use com o comprovante. Ausências fora desses casos são abono.')
) AS "defaults" ("name", "previous_description", "description")
WHERE lower("justification_types"."name") = lower("defaults"."name")
	AND "justification_types"."description" = "defaults"."previous_description";
