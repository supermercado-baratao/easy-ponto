import { TState } from '@/entry/form-action'
import type { User } from '@/infra/database/types'
import { TAfdSynchronizationParams } from '@/models/synchronization/types'
import { TUserWithPunchRecords } from '@/models/user/types'

export type TSynchronizationState = TState<
  TAfdSynchronizationParams,
  {
    users: User[]
    user: TUserWithPunchRecords | null
  }
>
