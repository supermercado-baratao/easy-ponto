import { z } from 'zod'

import { yearSchema } from '@/models/holiday/schema'

const MONTH_ERROR = { error: 'Selecione um mês válido' }

const monthSchema = z.preprocess(
  (month) => (month === '' || month === undefined ? null : month),
  z.coerce
    .number(MONTH_ERROR)
    .int(MONTH_ERROR)
    .min(1, MONTH_ERROR)
    .max(12, MONTH_ERROR)
    .nullable()
)

export const findManyByYearSchema = z.object({
  companyId: z.uuidv4(),
  year: yearSchema
})

export const saveSchema = findManyByYearSchema.extend({
  userId: z.uuidv4(),
  month: monthSchema
})

export const registerJustificationSchema = findManyByYearSchema.extend({
  userId: z.uuidv4()
})
