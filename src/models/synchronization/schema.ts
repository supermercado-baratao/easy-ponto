import { z } from 'zod'

import { DEVICE_COMPANY_FIELDS } from '@/models/company/utils'

export const importFileSchema = z.object({
  resolutions: z
    .record(z.string(), z.uuidv4({ error: 'Selecione o tipo' }))
    .default({})
})

export const companySynchronizationSchema = z.object({
  fields: z.array(z.enum(DEVICE_COMPANY_FIELDS)).min(1)
})
