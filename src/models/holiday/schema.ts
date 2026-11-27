import { z } from 'zod'

import { MAX_YEAR, MIN_YEAR } from '@/constants/year'

import { HOLIDAY_SCOPES, MAX_EASTER_OFFSET, MIN_EASTER_OFFSET } from './utils'

export const yearSchema = z.coerce.number().int().min(MIN_YEAR).max(MAX_YEAR)

const emptyToUndefined = (value: unknown): unknown =>
  value === '' || value === null ? undefined : value

const optionalYearSchema = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ error: 'Informe um ano válido' })
    .int('Informe um ano válido')
    .min(MIN_YEAR, `Informe um ano a partir de ${MIN_YEAR}`)
    .max(MAX_YEAR, `Informe um ano até ${MAX_YEAR}`)
    .optional()
)

const dateSchema = z.iso.date({ error: 'Informe uma data válida' })

const baseSchema = z.object({
  companyId: z.uuidv4(),
  name: z.string().trim().min(1, 'Informe o nome'),
  scope: z.enum(HOLIDAY_SCOPES, { error: 'Selecione a abrangência' })
})

const validitySchema = z.object({
  firstYear: optionalYearSchema,
  lastYear: optionalYearSchema
})

const onceSchema = baseSchema.extend({
  recurrence: z.literal('once'),
  date: dateSchema
})

const yearlySchema = baseSchema.extend({
  ...validitySchema.shape,
  recurrence: z.literal('yearly'),
  date: dateSchema.refine((date) => !date.endsWith('-02-29'), {
    message: 'Um feriado que repete todo ano não pode ser em 29/02'
  })
})

const easterSchema = baseSchema.extend({
  ...validitySchema.shape,
  recurrence: z.literal('easter'),
  easterDays: z.coerce
    .number({ error: 'Informe o número de dias' })
    .int('Informe um número inteiro de dias')
    .min(0, 'Informe um número de dias a partir de 0'),
  easterSide: z.enum(['before', 'after'], {
    error: 'Selecione antes ou depois da Páscoa'
  })
})

const dataSchema = z
  .discriminatedUnion('recurrence', [onceSchema, yearlySchema, easterSchema], {
    error: 'Selecione a repetição'
  })
  .transform((data) =>
    data.recurrence === 'easter'
      ? {
          companyId: data.companyId,
          name: data.name,
          scope: data.scope,
          recurrence: data.recurrence,
          date: null,
          easterOffset:
            data.easterSide === 'before' ? -data.easterDays : data.easterDays,
          firstYear: data.firstYear ?? null,
          lastYear: data.lastYear ?? null
        }
      : {
          companyId: data.companyId,
          name: data.name,
          scope: data.scope,
          recurrence: data.recurrence,
          date: data.date,
          easterOffset: null,
          firstYear:
            data.recurrence === 'yearly' ? (data.firstYear ?? null) : null,
          lastYear:
            data.recurrence === 'yearly' ? (data.lastYear ?? null) : null
        }
  )
  .superRefine(({ easterOffset, firstYear, lastYear }, context) => {
    if (
      easterOffset !== null &&
      (easterOffset < MIN_EASTER_OFFSET || easterOffset > MAX_EASTER_OFFSET)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['easterDays'],
        message: `Informe até ${-MIN_EASTER_OFFSET} dias antes ou ${MAX_EASTER_OFFSET} dias depois da Páscoa, para o feriado ficar no mesmo ano`
      })
    }
    if (firstYear !== null && lastYear !== null && firstYear > lastYear) {
      context.addIssue({
        code: 'custom',
        path: ['lastYear'],
        message: 'O último ano não pode ser antes do primeiro'
      })
    }
  })

const fromYearSchema = z.preprocess(
  (value) => (value === 'all' ? undefined : emptyToUndefined(value)),
  yearSchema.optional()
)

export const createSchema = dataSchema

export const updateSchema = z.intersection(
  dataSchema,
  z.object({ id: z.uuidv4(), fromYear: fromYearSchema })
)

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4(),
  fromYear: fromYearSchema
})

export const findManyByCompanyIdSchema = z.uuidv4()

export const findManyByYearSchema = z.object({
  companyId: z.uuidv4(),
  year: yearSchema
})

export const addNationalHolidaysSchema = z.uuidv4()
