import type { z } from 'zod'

import type { createSchema, removeSchema, updateSchema } from './schema'

export type TJobFunctionCreateData = z.input<typeof createSchema>

export type TJobFunctionUpdateData = z.input<typeof updateSchema>

export type TJobFunctionRemoveParams = z.input<typeof removeSchema>
