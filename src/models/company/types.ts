import { z } from 'zod'

import { createSchema, saveSchema, updateSchema } from './schema'

export type TCompanyCreateData = z.input<typeof createSchema>

export type TCompanySaveData = z.input<typeof saveSchema>

export type TCompanyUpdateData = z.input<typeof updateSchema>
