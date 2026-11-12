import type { TJustificationEffect } from '@/models/justification-type/utils'

export const CREATE_TYPE_BUTTON_ID = 'create-justification-type'

export const EFFECT_LABELS: Record<TJustificationEffect, string> = {
  deduct: 'Desconta do banco de horas',
  excuse: 'Abona'
}

export const getEffectLabel = (effect: string): string =>
  EFFECT_LABELS[effect as TJustificationEffect] ?? effect
