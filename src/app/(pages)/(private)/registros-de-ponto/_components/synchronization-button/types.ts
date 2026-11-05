import type { User } from '@/infra/database/types'
import { TState } from '@/infra/form-action'
import { TAfdSynchronizationParams } from '@/models/synchronization-model/types'
import { TUserWithPunchRecords } from '@/models/user-model/types'

export type TSynchronizationState = TState<
  TAfdSynchronizationParams,
  {
    users: User[]
    user: TUserWithPunchRecords | null
  }
>
