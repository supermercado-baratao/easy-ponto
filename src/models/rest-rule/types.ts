import type { z } from 'zod'

import type {
  createSchema,
  periodSchema,
  removeSchema,
  updateSchema
} from './schema'
import type { TRestMove } from './utils'

export type TRestRuleCreateData = z.input<typeof createSchema>

export type TRestRuleUpdateData = z.input<typeof updateSchema>

export type TRestRuleRemoveParams = z.input<typeof removeSchema>

export type TRestRulePeriodParams = z.input<typeof periodSchema>

export type TRestPreviewMove = TRestMove & { userName: string }

export type TRestPreview = {
  initialDate: string
  finalDate: string
  moves: TRestPreviewMove[]
}

export type TRestGenerateResult = {
  moved: number
  unmoved: number
}
