import type { TState } from '@/entry/form-action'
import type { TAccountSetupData } from '@/models/account/types'

export type TSetupFormValues = Partial<
  Pick<TAccountSetupData, 'companyName' | 'name' | 'email'>
>

export type TSetupState = TState<TAccountSetupData, void> & {
  values?: TSetupFormValues
}
