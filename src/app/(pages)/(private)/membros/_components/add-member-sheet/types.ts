import type { TState } from '@/entry/form-action'
import type { TMemberAddData } from '@/models/member/types'

export type TAddMemberFormValues = Partial<
  Record<'name' | 'email' | 'role', string>
>

export type TAddMemberFormState = Omit<
  TState<TMemberAddData, never>,
  'data'
> & {
  values?: TAddMemberFormValues
}
