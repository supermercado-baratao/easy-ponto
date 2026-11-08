import { z } from 'zod'

import { findInEffectParamsSchema, saveSchema } from './schema'

export type TScheduleSaveData = z.input<typeof saveSchema>

export type TScheduleFindInEffectParams = z.infer<
  typeof findInEffectParamsSchema
>
