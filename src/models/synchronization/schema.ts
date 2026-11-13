import { z } from 'zod'

import { createSchema as justificationTypeCreateSchema } from '@/models/justification-type/schema'

export const codeResolutionSchema = z.discriminatedUnion(
  'action',
  [
    justificationTypeCreateSchema
      .omit({ companyId: true })
      .extend({ action: z.literal('create') }),
    z.object({
      action: z.literal('associate'),
      typeId: z.uuidv4({ error: 'Selecione o tipo' })
    })
  ],
  { error: 'Escolha o que fazer com o código' }
)

export const importFileSchema = z.object({
  resolutions: z.record(z.string(), codeResolutionSchema).default({})
})
