import { z } from 'zod'

import { JUSTIFICATION_EFFECTS } from './utils'

const dataSchema = z.object({
  companyId: z.uuidv4(),
  name: z.string().trim().min(1, 'Informe o nome'),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value?.length ? value : null)),
  effect: z.enum(JUSTIFICATION_EFFECTS, { error: 'Selecione o efeito' })
})

export const createSchema = dataSchema

export const updateSchema = dataSchema.safeExtend({ id: z.uuidv4() })

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findManyByCompanyIdSchema = z.uuidv4()
