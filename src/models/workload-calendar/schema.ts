import { z } from 'zod'

import { MAX_YEAR, MIN_YEAR } from '@/constants/year'

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .refine((month) => {
    const year = Number(month.slice(0, 4))
    return year >= MIN_YEAR && year <= MAX_YEAR
  })

// The employee comes from the URL, so an unknown one only leaves the grid out
export const findMonthSchema = z.object({
  companyId: z.uuidv4(),
  month: monthSchema,
  userId: z
    .string()
    .optional()
    .transform((value) => z.uuidv4().safeParse(value).data ?? null)
})
