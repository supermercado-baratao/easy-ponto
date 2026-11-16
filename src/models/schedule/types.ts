import { z } from 'zod'

import type { TScheduleWithDays, User } from '@/infra/database/types'

import {
  findInEffectParamsSchema,
  findManyInEffectByCompanyIdParamsSchema,
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

export type TScheduleFindManyInEffectByCompanyIdParams = z.infer<
  typeof findManyInEffectByCompanyIdParamsSchema
>

export type TUserSchedule = {
  user: User
  schedule: TScheduleWithDays | null
}
