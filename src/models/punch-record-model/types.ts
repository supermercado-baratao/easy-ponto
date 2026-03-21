import { z } from 'zod'

import {
  createManySchema,
  createSchema,
  findManyParamsSchema,
  updateSchema
} from './schema'

export type TPunchRecordCreateData = z.infer<typeof createSchema>

export type TPunchRecordCreateManyData = z.infer<typeof createManySchema>

export type TPunchRecordFindManyParams = z.infer<typeof findManyParamsSchema>

export type TPunchRecordUpdateData = z.infer<typeof updateSchema>
