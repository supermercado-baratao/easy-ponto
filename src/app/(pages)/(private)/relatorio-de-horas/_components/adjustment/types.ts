import type { TState } from '@/entry/form-action'
import type { THoursBankAdjustmentUpdateData } from '@/models/hours-bank/types'

export type TAdjustmentFormValues = Partial<
  Record<'id' | 'date' | 'minutes' | 'reason', string>
>

export type TAdjustmentFormState = Omit<
  TState<THoursBankAdjustmentUpdateData, never>,
  'data'
> & {
  values?: TAdjustmentFormValues
}

export type TRemoveAdjustmentState = Pick<
  TState<never, never>,
  'success' | 'fatalError' | 'message'
> & {
  action?: string
}
