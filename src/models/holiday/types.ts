import { z } from 'zod'

import type { Holiday } from '@/infra/database/types'

import {
  addNationalHolidaysSchema,
  createSchema,
  findManyByYearSchema,
  removeSchema,
  updateSchema
} from './schema'

export type THolidayCreateData = z.input<typeof createSchema>

export type THolidayUpdateData = z.input<typeof updateSchema>

export type THolidayRemoveParams = z.infer<typeof removeSchema>

export type THolidayFindManyByYearParams = z.input<typeof findManyByYearSchema>

export type THolidayAddNationalHolidaysParams = z.input<
  typeof addNationalHolidaysSchema
>

export type THolidayInYear = Holiday & { dateInYear: string }
