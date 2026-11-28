import { z } from 'zod'

import { MAX_YEAR, MIN_YEAR } from '@/constants/year'

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine((month) => {
    const year = Number(month.slice(0, 4))
    return year >= MIN_YEAR && year <= MAX_YEAR
  })

export const limitSchema = z.coerce.number().int().min(0).max(9999)

export const findReportSchema = z
  .object({
    companyId: z.uuidv4(),
    initialMonth: monthSchema,
    finalMonth: monthSchema,
    limit: limitSchema.nullable()
  })
  .refine(({ initialMonth, finalMonth }) => initialMonth <= finalMonth)
