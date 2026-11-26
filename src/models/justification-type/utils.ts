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
      'Ausência por doença ou consulta, comprovada por atestado médico ou odontológico. Não desconta do banco de horas.',
    effect: 'excuse'
  },
  {
    name: 'Ausência legal',
    description:
      'Faltas permitidas por lei sem desconto, como casamento, falecimento de cônjuge, pais, avós, filhos, netos, irmãos ou dependente, doação de sangue ou comparecimento à Justiça (art. 473 da CLT). Use com o comprovante. Ausências fora desses casos são abono.',
    effect: 'excuse'
  },
  {
    name: 'Férias',
    description:
      'Período de férias do funcionário. Não desconta do banco de horas. É criada ao registrar as férias planejadas em Férias.',
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
