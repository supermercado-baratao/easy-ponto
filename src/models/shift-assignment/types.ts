import { z } from 'zod'

import {
  createSchema,
  findManyByUserIdParamsSchema,
  findUserDaysParamsSchema,
  removeAdjustmentSchema,
  removeSchema,
  saveAdjustmentSchema,
  updateSchema
} from './schema'

export type TShiftAssignmentCreateData = z.input<typeof createSchema>

export type TShiftAssignmentUpdateData = z.input<typeof updateSchema>

export type TShiftAssignmentRemoveParams = z.infer<typeof removeSchema>

export type TShiftAssignmentFindManyByUserIdParams = z.infer<
  typeof findManyByUserIdParamsSchema
>

export type TShiftAssignmentFindUserDaysParams = z.infer<
  typeof findUserDaysParamsSchema
>

export type TShiftAdjustmentRemoveParams = z.infer<
  typeof removeAdjustmentSchema
>

export type TShiftAdjustmentSaveData = z.input<typeof saveAdjustmentSchema>
