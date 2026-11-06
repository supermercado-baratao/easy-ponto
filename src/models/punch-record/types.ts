import { z } from 'zod'

import type { PunchRecord } from '@/infra/database/types'

import {
  createManyExistentsInAfdSchema,
  createNonExistentInAfdSchema,
  findManyByDayParamsSchema,
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

export type TPunchRecordFindManyByDayParams = z.infer<
  typeof findManyByDayParamsSchema
>

export type TPunchRecordUpdateData = z.infer<typeof updateSchema>

export type TPunchRecordPeriod = {
  initialDate: string
  finalDate: string
}

export type TPunchRecordDay = {
  date: string
  punchRecords: PunchRecord[]
}
