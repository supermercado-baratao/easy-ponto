import type { User } from '@/infra/database/types'
import { TState } from '@/infra/form-action'
import { TAfdSynchronizationParams } from '@/models/synchronization/types'
import { TUserWithPunchRecords } from '@/models/user/types'

export type TSynchronizationState = TState<
  TAfdSynchronizationParams,
  {
    users: User[]
    user: TUserWithPunchRecords | null
  }
>
