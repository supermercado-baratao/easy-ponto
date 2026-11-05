import { z } from 'zod'

import { updateSchema, upsertSchema } from './schema'

export type TCompanyUpsertData = z.infer<typeof upsertSchema>

export type TCompanyUpdateData = z.infer<typeof updateSchema>
