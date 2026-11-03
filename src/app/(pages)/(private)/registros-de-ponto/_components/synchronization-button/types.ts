import type { User } from '@/infra/database/generated/client'
import { TState } from '@/infra/form-action'
import { TAfdSynchronizationParams, TUserWithPunchRecords } from '@/models'

export type TSynchronizationState = TState<
  TAfdSynchronizationParams,
  {
    users: User[]
    user: TUserWithPunchRecords | null
  }
>
