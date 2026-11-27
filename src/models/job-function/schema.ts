import { z } from 'zod'

import { MAX_JOB_FUNCTION_LEVEL, MIN_JOB_FUNCTION_LEVEL } from './utils'

const dataSchema = z.object({
  companyId: z.uuidv4(),
  name: z.string().trim().min(1, 'Informe o nome'),
  description: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value?.length ? value : null)),
  level: z.coerce
    .number({ error: 'Informe o nível' })
    .int('Informe um número inteiro')
    .min(
      MIN_JOB_FUNCTION_LEVEL,
      `Informe um nível de pelo menos ${MIN_JOB_FUNCTION_LEVEL}`
    )
    .max(
      MAX_JOB_FUNCTION_LEVEL,
      `Informe um nível de no máximo ${MAX_JOB_FUNCTION_LEVEL}`
    )
})

export const createSchema = dataSchema

export const updateSchema = dataSchema.safeExtend({ id: z.uuidv4() })

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const companyIdSchema = z.uuidv4()
