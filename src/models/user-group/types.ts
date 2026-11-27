import type { z } from 'zod'

import type { createSchema, removeSchema, updateSchema } from './schema'

export type TUserGroupCreateData = z.input<typeof createSchema>

export type TUserGroupUpdateData = z.input<typeof updateSchema>

export type TUserGroupRemoveParams = z.input<typeof removeSchema>
