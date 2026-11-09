import { z } from 'zod'

import { HOLIDAY_SCOPES } from './utils'

export const yearSchema = z.coerce.number().int().min(2000).max(2100)

const dataSchema = z
  .object({
    companyId: z.uuidv4(),
    date: z.iso.date({ error: 'Informe uma data válida' }),
    name: z.string().trim().min(1, 'Informe o nome'),
    scope: z.enum(HOLIDAY_SCOPES, { error: 'Selecione a abrangência' }),
    recurring: z
      .union([z.boolean(), z.literal('on')])
      .optional()
      .transform((value) => value === true || value === 'on')
  })
  .refine(({ date, recurring }) => !recurring || !date.endsWith('-02-29'), {
    path: ['date'],
    message: 'Um feriado que repete todo ano não pode ser em 29/02'
  })

export const createSchema = dataSchema

export const updateSchema = dataSchema.safeExtend({ id: z.uuidv4() })

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findManyByYearSchema = z.object({
  companyId: z.uuidv4(),
  year: yearSchema
})

export const addNationalHolidaysSchema = findManyByYearSchema
