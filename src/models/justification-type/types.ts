import { z } from 'zod'

import { createSchema, removeSchema, updateSchema } from './schema'

export type TJustificationTypeCreateData = z.input<typeof createSchema>

export type TJustificationTypeUpdateData = z.input<typeof updateSchema>

export type TJustificationTypeRemoveParams = z.infer<typeof removeSchema>
