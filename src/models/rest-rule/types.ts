import type { z } from 'zod'

import type {
  Holiday,
  TRestRuleWithRelations,
  TShiftAssignmentWithPattern,
  User
} from '@/infra/database/types'
import type { TRestRestrictionInput } from '@/models/rest-restriction/utils'

import type {
  createSchema,
  periodSchema,
  planMonthsSchema,
  removeSchema,
  updateSchema
} from './schema'
import type { TRestMonthPlan, TRestMove } from './utils'

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

export type TRestRulePlanMonthsParams = z.input<typeof planMonthsSchema>

export type TRestPlanMonth = TRestMonthPlan<TShiftAssignmentWithPattern> & {
  month: string
  initialDate: string
  finalDate: string
}

export type TRestPlan = {
  users: User[]
  activeUsers: User[]
  rules: TRestRuleWithRelations[]
  restrictions: TRestRestrictionInput[]
  holidays: Holiday[]
  months: TRestPlanMonth[]
}
