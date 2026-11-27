import { z } from 'zod'

import type { TShiftAssignmentWithPattern } from '@/infra/database/types'

import {
  createSchema,
  findCompanyDaysParamsSchema,
  findManyByUserIdParamsSchema,
  findUserDaysParamsSchema,
  removeAdjustmentSchema,
  removeSchema,
  saveAdjustmentSchema,
  updateSchema
} from './schema'
import type { TResolvedDay } from './utils'

export type TShiftAssignmentCreateData = z.input<typeof createSchema>

export type TShiftAssignmentUpdateData = z.input<typeof updateSchema>

export type TShiftAssignmentRemoveParams = z.infer<typeof removeSchema>

export type TShiftAssignmentFindManyByUserIdParams = z.infer<
  typeof findManyByUserIdParamsSchema
>

export type TShiftAssignmentFindCompanyDaysParams = z.infer<
  typeof findCompanyDaysParamsSchema
>

export type TUserShiftDays = {
  userId: string
  assignments: TShiftAssignmentWithPattern[]
  days: TResolvedDay[]
}

export type TShiftAssignmentFindUserDaysParams = z.infer<
  typeof findUserDaysParamsSchema
>

export type TShiftAdjustmentRemoveParams = z.infer<
  typeof removeAdjustmentSchema
>

export type TShiftAdjustmentSaveData = z.input<typeof saveAdjustmentSchema>
