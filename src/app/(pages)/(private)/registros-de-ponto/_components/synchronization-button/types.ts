import { User } from '@prisma/client'

import { TState } from '@/infra/form-action'
import { TAfdSynchronizationParams, TUserWithPunchRecords } from '@/models'

export type TSynchronizationState = TState<
  TAfdSynchronizationParams,
  {
    users: User[]
    user: TUserWithPunchRecords | null
  }
>
