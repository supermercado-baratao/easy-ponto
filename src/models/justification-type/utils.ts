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
  code: string
  description: string
  effect: TJustificationEffect
}[] = [
  { code: 'COMPENSACAO', description: 'Compensação', effect: 'deduct' },
  { code: 'ABONO', description: 'Abono', effect: 'excuse' },
  { code: 'ATESTADO', description: 'Atestado médico', effect: 'excuse' },
  { code: 'AUSENCIA LEGAL', description: 'Ausência legal', effect: 'excuse' },
  { code: 'FERIAS', description: 'Férias', effect: 'excuse' },
  { code: 'LICENCA', description: 'Licença', effect: 'excuse' }
]
