import { z } from 'zod'

import {
  findInEffectParamsSchema,
  findManyInPeriodParamsSchema,
  saveSchema
} from './schema'

export type TScheduleSaveData = z.input<typeof saveSchema>

export type TScheduleFindInEffectParams = z.infer<
  typeof findInEffectParamsSchema
>

export type TScheduleFindManyInPeriodParams = z.infer<
  typeof findManyInPeriodParamsSchema
>
