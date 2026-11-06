import { z } from 'zod'

import { updateSchema, upsertSchema } from './schema'

export type TCompanyUpsertData = z.infer<typeof upsertSchema>

export type TCompanyUpsertForAdminUserData = TCompanyUpsertData & {
  adminUserId: string
}

export type TCompanyUpdateData = z.infer<typeof updateSchema>
