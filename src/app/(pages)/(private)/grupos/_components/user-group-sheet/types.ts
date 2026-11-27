import type { TState } from '@/entry/form-action'
import type { TUserGroupUpdateData } from '@/models/user-group/types'

export type TUserGroupFormValues = Partial<
  Record<'id' | 'name' | 'parentId', string>
>

export type TUserGroupFormState = Omit<
  TState<TUserGroupUpdateData, never>,
  'data'
> & {
  values?: TUserGroupFormValues
}
