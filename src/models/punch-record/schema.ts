import { isPIS } from 'validation-br'
import { z } from 'zod'

import { PIS_LENGTH } from '@/constants/length'
import { dayjs } from '@/infra/dayjs'

const isValidDate = (date: string): boolean => dayjs(date).isValid()

const pisSchema = z
  .string()
  .refine((value) => isPIS(value) || value.length === PIS_LENGTH, {
    message: `PIS inválido`
  })

const dateSchema = z.string().refine((value) => isValidDate(value), {
  message: 'Data deve estar no formato yyyy-mm-dd'
})

export const createNonExistentInAfdSchema = z.object({
  pis: pisSchema,
  datetime: z.coerce.date()
})

export const createManyNonExistentsInAfdSchema = z
  .array(createNonExistentInAfdSchema)
  .nonempty()

const afdFieldsSchema = z.object({
  afdDatetime: z.coerce.date(),
  nsr: z.number().int().positive(),
  registrationType: z.string().length(1),
  hexadecimalCheckDigit: z.string().length(4)
})

export const createManyExistentsInAfdSchema = z
  .array(createNonExistentInAfdSchema.and(afdFieldsSchema))
  .nonempty()

export const updateSchema = z.object({
  id: z.uuidv4(),
  datetime: z.coerce.date()
})

export const updateManySchema = z.array(updateSchema).nonempty()

export const findManyParamsSchema = z.object({
  pis: pisSchema.nullish(),
  initialNsr: z.coerce.number().int().positive().nullish(),
  finalNsr: z.coerce.number().int().positive().nullish(),
  initialDate: dateSchema.nullish(),
  finalDate: dateSchema.nullish()
})

export const findManyByDayParamsSchema = z.object({
  pis: pisSchema,
  initialDate: dateSchema,
  finalDate: dateSchema
})
