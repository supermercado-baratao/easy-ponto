import { z } from 'zod'

const dataSchema = z.object({
  companyId: z.uuidv4(),
  name: z.string().trim().min(1, 'Informe o nome'),
  parentId: z
    .union([z.uuidv4(), z.literal('')])
    .nullish()
    .transform((value) => (value === '' || value === undefined ? null : value))
})

export const createSchema = dataSchema

export const updateSchema = dataSchema
  .safeExtend({ id: z.uuidv4() })
  .refine(({ id, parentId }) => id !== parentId, {
    path: ['parentId'],
    message: 'Um grupo não pode ficar dentro dele mesmo'
  })

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findManyByCompanyIdSchema = z.uuidv4()
