import { z } from 'zod'

import {
  createManyExistentsInAfdSchema,
  createNonExistentInAfdSchema,
  findManyParamsSchema,
  updateSchema
} from './schema'

export type TPunchRecordCreateNonExistentInAfdData = z.infer<
  typeof createNonExistentInAfdSchema
>

export type TPunchRecordCreateManyExistentsInAfdData = z.infer<
  typeof createManyExistentsInAfdSchema
>

export type TPunchRecordFindManyParams = z.infer<typeof findManyParamsSchema>

export type TPunchRecordUpdateData = z.infer<typeof updateSchema>
