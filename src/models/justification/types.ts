import { z } from 'zod'

import {
  createSchema,
  findManyInPeriodSchema,
  removeSchema,
  updateSchema
} from './schema'

export type TJustificationCreateData = z.input<typeof createSchema>

export type TJustificationUpdateData = z.input<typeof updateSchema>

export type TJustificationRemoveParams = z.infer<typeof removeSchema>

export type TJustificationFindManyInPeriodParams = z.input<
  typeof findManyInPeriodSchema
>
