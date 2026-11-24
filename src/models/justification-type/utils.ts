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
  effect: TJustificationEffect
}[] = [
  { name: 'Compensação', effect: 'deduct' },
  { name: 'Abono', effect: 'excuse' },
  { name: 'Atestado médico', effect: 'excuse' },
  { name: 'Ausência legal', effect: 'excuse' },
  { name: 'Férias', effect: 'excuse' },
  { name: 'Licença', effect: 'excuse' }
]

// Matches the unique index of justification_types, so "Abono" and "abono" are the same type
export const isSameTypeName = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()
