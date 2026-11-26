import { z } from 'zod'

import { createSchema, removeSchema, updateSchema } from './schema'

export type TShiftPatternCreateData = z.input<typeof createSchema>

export type TShiftPatternUpdateData = z.input<typeof updateSchema>

export type TShiftPatternRemoveParams = z.infer<typeof removeSchema>
