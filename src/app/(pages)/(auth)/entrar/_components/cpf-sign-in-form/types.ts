import type { TState } from '@/entry/form-action'
import type { TCpfSignInData } from '@/models/account/types'

export type TCpfSignInState = TState<TCpfSignInData, void> & {
  values?: { cpf?: string }
}
