import { z } from 'zod'

import { timeSchema } from '@/models/schedule/schema'
import { timeToMinutes } from '@/models/schedule/utils'

const dataSchema = z.object({
  companyId: z.uuidv4(),
  userId: z.uuidv4(),
  typeId: z.uuidv4({ error: 'Selecione o tipo' }),
  startDate: z.iso.date({ error: 'Informe uma data válida' }),
  endDate: z.iso.date({ error: 'Informe uma data válida' }),
  startTime: timeSchema,
  endTime: timeSchema,
  note: z.string().trim().default('')
})

type TData = z.infer<typeof dataSchema>

const validatePeriod = (
  { startDate, endDate, startTime, endTime }: TData,
  context: z.RefinementCtx
): void => {
  if (endDate < startDate) {
    context.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'A data final deve ser igual ou depois da inicial'
    })
  }
  if (startTime === '' && endTime === '') return

  if (startDate !== endDate) {
    context.addIssue({
      code: 'custom',
      path: ['startTime'],
      message:
        'O horário só pode ser informado numa justificativa de um único dia'
    })
    return
  }
  if (startTime === '') {
    context.addIssue({
      code: 'custom',
      path: ['startTime'],
      message: 'Informe o horário de início'
    })
    return
  }
  if (endTime === '') {
    context.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: 'Informe o horário de fim'
    })
    return
  }
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    context.addIssue({
      code: 'custom',
      path: ['endTime'],
      message: 'O horário de fim deve ser depois do de início'
    })
  }
}

const toPersistedData = <T extends TData>({
  startTime,
  endTime,
  note,
  ...data
}: T): Omit<T, 'startTime' | 'endTime' | 'note'> & {
  startTime: number | null
  endTime: number | null
  note: string | null
} => ({
  ...data,
  startTime: startTime === '' ? null : timeToMinutes(startTime),
  endTime: endTime === '' ? null : timeToMinutes(endTime),
  note: note === '' ? null : note
})

export const createSchema = dataSchema
  .superRefine(validatePeriod)
  .transform(toPersistedData)

export const updateSchema = dataSchema
  .safeExtend({ id: z.uuidv4() })
  .superRefine(validatePeriod)
  .transform(toPersistedData)

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findManyInPeriodSchema = z.object({
  userId: z.uuidv4(),
  initialDate: z.iso.date(),
  finalDate: z.iso.date()
})
