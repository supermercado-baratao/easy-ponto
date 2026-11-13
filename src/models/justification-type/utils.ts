export const JUSTIFICATION_EFFECTS = ['deduct', 'excuse'] as const

export type TJustificationEffect = (typeof JUSTIFICATION_EFFECTS)[number]

export const EFFECT_LABELS: Record<TJustificationEffect, string> = {
  deduct: 'Desconta do banco de horas',
  excuse: 'Abona'
}

export const getEffectLabel = (effect: string): string =>
  EFFECT_LABELS[effect as TJustificationEffect] ?? effect
