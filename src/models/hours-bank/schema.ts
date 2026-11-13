import { z } from 'zod'

import { HOURS_BANK_ORDERS } from './utils'

const MINUTES_PATTERN = /^([+-])?(\d{1,4}):([0-5]\d)$/

const minutesSchema = z
  .string()
  .trim()
  .regex(MINUTES_PATTERN, 'Informe as horas no formato hh:mm ou -hh:mm')
  .transform((value) => {
    const [, sign, hours, minutes] = MINUTES_PATTERN.exec(value) ?? []
    const total = Number(hours) * 60 + Number(minutes)
    return sign === '-' ? -total : total
  })
  .refine((minutes) => minutes !== 0, 'O ajuste não pode ser zero')

const adjustmentDataSchema = z.object({
  companyId: z.uuidv4(),
  userId: z.uuidv4(),
  date: z.iso.date({ error: 'Informe uma data válida' }),
  minutes: minutesSchema,
  reason: z.string().trim().min(1, 'Informe o motivo')
})

export const createAdjustmentSchema = adjustmentDataSchema

export const updateAdjustmentSchema = adjustmentDataSchema.safeExtend({
  id: z.uuidv4()
})

export const removeAdjustmentSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

const periodSchema = z.object({
  companyId: z.uuidv4(),
  initialDate: z.iso.date(),
  finalDate: z.iso.date()
})

export const generateSchema = z.object({
  companyId: z.uuidv4(),
  initialDate: z.string().optional(),
  finalDate: z.string().optional(),
  order: z
    .string()
    .optional()
    .transform(
      (order) => HOURS_BANK_ORDERS.find((value) => value === order) ?? 'balance'
    )
})

export const closeSchema = periodSchema.refine(
  ({ initialDate, finalDate }) => initialDate <= finalDate,
  {
    path: ['finalDate'],
    message: 'A data final deve ser igual ou depois da inicial'
  }
)

export const reopenSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

const totalMinutesSchema = z.number().int()

const initialBalanceItemSchema = z.object({
  userId: z.uuidv4(),
  absence: totalMinutesSchema,
  dayOff: totalMinutesSchema,
  overtime60: totalMinutesSchema,
  overtime100: totalMinutesSchema,
  adjustment: totalMinutesSchema
})

export const initialBalanceSchema = z
  .object({
    companyId: z.uuidv4(),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    balances: z.array(initialBalanceItemSchema)
  })
  .refine(({ startDate, endDate }) => startDate <= endDate, {
    path: ['endDate'],
    message: 'A data final deve ser igual ou depois da inicial'
  })
