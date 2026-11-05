import { TState } from '@/entry/form-action'
import type { TUserWithPunchRecords, User } from '@/infra/database/types'
import { TAfdSynchronizationParams } from '@/models/synchronization/types'

export type TSynchronizationState = TState<
  TAfdSynchronizationParams,
  {
    users: User[]
    user: TUserWithPunchRecords | null
  }
>
