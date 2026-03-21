import { isPIS } from 'validation-br'
import { z } from 'zod'

import { PIS_LENGTH } from '@/constants'
import { isValidDate } from '@/utils'

export const createSchema = z.object({
  pis: z
    .string()
    .refine((value) => isPIS(value) || value.length === PIS_LENGTH, {
      message: `PIS inválido`
    }),
  datetime: z.coerce.date()
})

export const createManySchema = z
  .array(
    createSchema.and(
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
  datetime: z.coerce.date()
})

export const findManyParamsSchema = z
  .object({
    companyId: z.uuidv4().nullish(),
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
  .superRefine((data, ctx) => {
    if (!data.companyId && !data.pis) {
      ctx.addIssue({
        code: 'invalid_value',
        values: [data.companyId, data.pis],
        path: ['companyId', 'pis'],
        message: 'Deve fornecer companyId ou pis'
      })
    }
  })
