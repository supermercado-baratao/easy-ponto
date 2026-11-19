import type { TState } from '@/entry/form-action'
import type { TEmailSignInData } from '@/models/account/types'

export type TEmailSignInState = TState<TEmailSignInData, void> & {
  values?: { email?: string }
}
