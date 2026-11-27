import { z } from 'zod'

import { TIME_FIELDS, type TTimeField } from '@/constants/time'
import { timeSchema } from '@/infra/time'
import { parseDayTimes } from '@/models/shift-pattern/schema'
import { isDayOff, MAX_CYCLE_LENGTH } from '@/models/shift-pattern/utils'

import { SHIFT_ADJUSTMENT_KINDS } from './utils'

const optionalDateSchema = z
  .union([z.literal(''), z.iso.date({ error: 'Informe uma data válida' })])
  .optional()
  .transform((value) => (value === undefined || value === '' ? null : value))

const assignmentShape = {
  companyId: z.uuidv4(),
  userId: z.uuidv4(),
  shiftPatternId: z.uuidv4({ error: 'Selecione a escala' }),
  startDate: z.iso.date({ error: 'Informe a data de início' }),
  endDate: optionalDateSchema,
  cycleStartDay: z.coerce
    .number({ error: 'Selecione o dia do ciclo' })
    .int('Selecione o dia do ciclo')
    .min(1, 'Selecione o dia do ciclo')
    .max(MAX_CYCLE_LENGTH, 'Selecione o dia do ciclo')
}

const refinePeriod = (
  { startDate, endDate }: { startDate: string; endDate: string | null },
  context: z.RefinementCtx
): void => {
  if (endDate !== null && endDate < startDate) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'O fim deve ser depois do início'
    })
  }
}

export const createSchema = z.object(assignmentShape).superRefine(refinePeriod)

export const updateSchema = z
  .object({ id: z.uuidv4(), ...assignmentShape })
  .superRefine(refinePeriod)

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findManyByUserIdParamsSchema = z.object({
  userId: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findCompanyDaysParamsSchema = z
  .object({
    companyId: z.uuidv4(),
    initialDate: z.iso.date(),
    finalDate: z.iso.date()
  })
  .refine(({ initialDate, finalDate }) => initialDate <= finalDate, {
    message: 'O fim deve ser depois do início'
  })

export const findUserDaysParamsSchema = z
  .object({
    userId: z.uuidv4(),
    companyId: z.uuidv4(),
    initialDate: z.iso.date(),
    finalDate: z.iso.date()
  })
  .refine(({ initialDate, finalDate }) => initialDate <= finalDate, {
    message: 'O fim deve ser depois do início'
  })

const timeFieldsShape = Object.fromEntries(
  TIME_FIELDS.map((field) => [field, timeSchema])
) as Record<TTimeField, typeof timeSchema>

export const saveAdjustmentSchema = z
  .object({
    companyId: z.uuidv4(),
    userId: z.uuidv4(),
    date: z.iso.date({ error: 'Informe a data' }),
    kind: z.enum(SHIFT_ADJUSTMENT_KINDS, { error: 'Selecione o ajuste' }),
    shiftAssignmentId: z
      .union([z.literal(''), z.uuidv4()])
      .optional()
      .transform((value) =>
        value === undefined || value === '' ? null : value
      ),
    ...timeFieldsShape
  })
  .superRefine((data, context) => {
    if (data.kind === 'work' && data.shiftAssignmentId === null) {
      context.addIssue({
        code: 'custom',
        path: ['shiftAssignmentId'],
        message: 'Selecione a escala'
      })
    }
    if (data.kind !== 'custom') return
    const parsed = parseDayTimes(data)
    if ('field' in parsed) {
      context.addIssue({
        code: 'custom',
        path: [parsed.field],
        message: parsed.message
      })
    } else if (isDayOff(parsed.day)) {
      context.addIssue({
        code: 'custom',
        path: ['entry1'],
        message: 'Informe os horários do dia'
      })
    }
  })
  .transform(
    ({ companyId, userId, date, kind, shiftAssignmentId, ...times }) => {
      const parsed = kind === 'custom' ? parseDayTimes(times) : null
      const day =
        parsed && 'day' in parsed
          ? parsed.day
          : (Object.fromEntries(
              TIME_FIELDS.map((field) => [field, null])
            ) as Record<TTimeField, null>)
      return {
        companyId,
        userId,
        date,
        kind,
        shiftAssignmentId: kind === 'work' ? shiftAssignmentId : null,
        ...day
      }
    }
  )

export const removeAdjustmentSchema = removeSchema
