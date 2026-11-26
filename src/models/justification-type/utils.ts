export const JUSTIFICATION_EFFECTS = ['deduct', 'excuse'] as const

export type TJustificationEffect = (typeof JUSTIFICATION_EFFECTS)[number]

export const EFFECT_LABELS: Record<TJustificationEffect, string> = {
  deduct: 'Desconta do banco de horas',
  excuse: 'Abona'
}

export const getEffectLabel = (effect: string): string =>
  EFFECT_LABELS[effect as TJustificationEffect] ?? effect

// A product organization, not a legal one: the CLT review (#65) may change it
export const DEFAULT_JUSTIFICATION_TYPES: {
  name: string
  description: string
  effect: TJustificationEffect
}[] = [
  {
    name: 'Compensação',
    description:
      'Folga paga com as horas do banco de horas. O tempo da ausência é descontado do saldo do funcionário. Use quando ele deixa de trabalhar em um dia ou turno para compensar horas extras.',
    effect: 'deduct'
  },
  {
    name: 'Abono',
    description:
      'Ausência perdoada pela empresa, sem desconto no banco de horas, quando a lei não garante o direito. Por exemplo, o falecimento de um parente distante ou uma liberação mais cedo. Escreva o motivo na observação da justificativa.',
    effect: 'excuse'
  },
  {
    name: 'Atestado médico',
    description:
      'Ausência por doença, comprovada por atestado médico ou odontológico que afasta o funcionário do trabalho, por dias ou horas. Não desconta do banco de horas. A declaração de comparecimento, que só informa o horário em que ele esteve na consulta, não é atestado.',
    effect: 'excuse'
  },
  {
    name: 'Ausência legal',
    description:
      'Faltas permitidas por lei sem desconto (art. 473 da CLT), como casamento, falecimento de cônjuge, pais, avós, filhos, netos, irmãos ou dependente, doação de sangue, comparecimento à Justiça, até 2 dias para acompanhar consultas e exames da esposa ou companheira grávida, 1 dia por ano para acompanhar filho de até 6 anos em consulta médica e até 3 dias a cada 12 meses para exames preventivos de câncer. Use com o comprovante. Ausências fora desses casos são abono.',
    effect: 'excuse'
  },
  {
    name: 'Férias',
    description:
      'Período de férias do funcionário. Não desconta do banco de horas. Use ao registrar as férias planejadas na tela Férias.',
    effect: 'excuse'
  },
  {
    name: 'Licença',
    description:
      'Afastamentos longos previstos em lei, como licença-maternidade, licença-paternidade ou afastamento pelo INSS. Não desconta do banco de horas.',
    effect: 'excuse'
  }
]

// Matches the unique index of justification_types, so "Abono" and "abono" are the same type
export const isSameTypeName = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()
