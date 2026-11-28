import { z } from 'zod'

export const findManyByCompanyIdSchema = z.object({
  companyId: z.uuidv4(),
  canEdit: z.boolean()
})

export const keySchema = z.object({
  companyId: z.uuidv4(),
  key: z.string().min(1)
})

export const dismissSchema = keySchema.safeExtend({
  dismissedById: z.string().min(1)
})
