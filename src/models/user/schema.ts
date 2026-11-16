import { z } from 'zod'

import { dayjs } from '@/infra/dayjs'

import { USER_STATUSES } from './utils'

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

export const statusSchema = z.enum(USER_STATUSES, {
  error: 'Selecione a situação'
})

export const updateSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4(),
  status: statusSchema,
  position: optionalText,
  department: optionalText,
  payrollNumber: optionalText,
  admissionDate: z
    .union([z.iso.date({ error: 'Informe uma data válida' }), z.literal('')])
    .optional()
    .transform((value) => (value ? dayjs(value).toDate() : null))
})

export const findManyByCompanyIdSchema = z.uuidv4()
