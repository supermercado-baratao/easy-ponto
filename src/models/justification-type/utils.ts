export const JUSTIFICATION_EFFECTS = ['deduct', 'excuse'] as const

export type TJustificationEffect = (typeof JUSTIFICATION_EFFECTS)[number]
