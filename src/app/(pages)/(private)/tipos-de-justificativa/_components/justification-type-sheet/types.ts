import type { TState } from '@/entry/form-action'
import type { TJustificationTypeUpdateData } from '@/models/justification-type/types'

export type TJustificationTypeFormValues = Partial<
  Record<'id' | 'name' | 'description' | 'effect', string>
>

export type TJustificationTypeFormState = Omit<
  TState<TJustificationTypeUpdateData, never>,
  'data'
> & {
  values?: TJustificationTypeFormValues
}
