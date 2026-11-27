import { z } from 'zod'

import { dayjs } from '@/infra/dayjs'

import { USER_STATUSES } from './utils'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const idsSchema = z
  .array(z.uuidv4())
  .default([])
  .transform((ids) => [...new Set(ids)])

export const statusSchema = z.enum(USER_STATUSES, {
  error: 'Selecione a situação'
})

export const updateSchema = z
  .object({
    id: z.uuidv4(),
    companyId: z.uuidv4(),
    status: statusSchema,
    position: optionalText,
    payrollPositionActive: z.stringbool().default(true),
    department: optionalText,
    payrollNumber: optionalText,
    admissionDate: z
      .union([z.iso.date({ error: 'Informe uma data válida' }), z.literal('')])
      .optional()
      .transform((value) => (value ? dayjs(value).toDate() : null)),
    groupIds: idsSchema,
    jobFunctionIds: idsSchema,
    activeJobFunctionIds: idsSchema
  })
  .transform(({ jobFunctionIds, activeJobFunctionIds, ...data }) => ({
    ...data,
    jobFunctions: jobFunctionIds.map((jobFunctionId) => ({
      jobFunctionId,
      active: activeJobFunctionIds.includes(jobFunctionId)
    }))
  }))

export const findManyByCompanyIdSchema = z.uuidv4()
