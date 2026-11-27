import { z } from 'zod'

import type { Holiday } from '@/infra/database/types'

import {
  createSchema,
  findManyByYearSchema,
  removeSchema,
  updateSchema
} from './schema'

export type THolidayCreateData = z.input<typeof createSchema>

export type THolidayUpdateData = z.input<typeof updateSchema>

export type THolidayRemoveParams = z.input<typeof removeSchema>

export type THolidayFindManyByYearParams = z.input<typeof findManyByYearSchema>

export type THolidayInYear = Holiday & { dateInYear: string }
