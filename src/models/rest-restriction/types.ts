import type { z } from 'zod'

import type { createSchema, removeSchema, updateSchema } from './schema'
import type { TRestRestrictionSummary } from './utils'

export type TRestRestrictionCreateData = z.input<typeof createSchema>

export type TRestRestrictionUpdateData = z.input<typeof updateSchema>

export type TRestRestrictionRemoveParams = z.input<typeof removeSchema>

export type TAssignmentRestBreak = {
  date: string
  restriction: TRestRestrictionSummary
}
