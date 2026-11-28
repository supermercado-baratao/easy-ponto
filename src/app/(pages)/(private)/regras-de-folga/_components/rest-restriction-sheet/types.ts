import type { TState } from '@/entry/form-action'
import type { TRestRestrictionUpdateData } from '@/models/rest-restriction/types'

export type TRestRestrictionFormValues = Partial<
  Record<'id' | 'kind' | 'level' | 'maxOff' | 'userGroupId' | 'userId', string>
> & {
  userIds?: string[]
  weekdays?: string[]
}

export type TRestRestrictionFormState = Omit<
  TState<TRestRestrictionUpdateData, never>,
  'data'
> & {
  values?: TRestRestrictionFormValues
}
