import { isPIS } from 'validation-br'
import { z } from 'zod'

import { PIS_LENGTH } from '@/constants/length'
import { isValidDate } from '@/utils/datetime'

export const createNonExistentInAfdSchema = z.object({
  pis: z
    .string()
    .refine((value) => isPIS(value) || value.length === PIS_LENGTH, {
      message: `PIS inválido`
    }),
  datetime: z.coerce.date()
})

export const createManyNonExistentsInAfdSchema = z
  .array(createNonExistentInAfdSchema)
  .nonempty()

export const createManyExistentsInAfdSchema = z
  .array(
    createNonExistentInAfdSchema.and(
      z.object({
        afdDatetime: z.coerce.date(),
        nsr: z.number().int().positive(),
        registrationType: z.string().length(1),
        hexadecimalCheckDigit: z.string().length(4)
      })
    )
  )
  .nonempty()

export const updateSchema = z.object({
  id: z.uuidv4(),
  datetime: z.coerce.date()
})

export const updateManySchema = z.array(updateSchema).nonempty()

export const findManyParamsSchema = z.object({
  pis: z
    .string()
    .refine((value) => isPIS(value) || value.length === PIS_LENGTH, {
      message: `PIS inválido`
    })
    .nullish(),
  initialNsr: z.coerce.number().int().positive().nullish(),
  finalNsr: z.coerce.number().int().positive().nullish(),
  initialDate: z
    .string()
    .refine((value) => isValidDate(value), {
      message: 'Data deve estar no formato yyyy-mm-dd'
    })
    .nullish(),
  finalDate: z
    .string()
    .refine((value) => isValidDate(value), {
      message: 'Data deve estar no formato yyyy-mm-dd'
    })
    .nullish()
})
