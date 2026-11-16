import { z } from 'zod'

import type {
  TVacationPlanWithJustification,
  User
} from '@/infra/database/types'
import type { TJustificationCreateData } from '@/models/justification/types'

import {
  findManyByYearSchema,
  registerJustificationSchema,
  saveSchema
} from './schema'

export type TVacationPlanFindManyByYearParams = z.input<
  typeof findManyByYearSchema
>

export type TVacationPlanSaveData = z.input<typeof saveSchema>

export type TVacationPlanRegisterJustificationData = z.input<
  typeof registerJustificationSchema
> &
  Pick<TJustificationCreateData, 'typeId' | 'startDate' | 'endDate' | 'note'>

export type TVacationPlanRow = {
  user: User
  plan: TVacationPlanWithJustification | null
}

export type TVacationMonth = {
  month: number
  users: User[]
}
