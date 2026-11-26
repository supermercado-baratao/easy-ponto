import type { TState } from '@/entry/form-action'
import type { JustificationType } from '@/infra/database/types'
import type { TJustificationTypeUpdateData } from '@/models/justification-type/types'

export type TJustificationTypeFormValues = Partial<
  Record<'id' | 'name' | 'description' | 'effect', string>
>

export type TSavedJustificationType = Pick<JustificationType, 'id' | 'name'>

export type TJustificationTypeFormState = Omit<
  TState<TJustificationTypeUpdateData, never>,
  'data'
> & {
  type?: TSavedJustificationType
  values?: TJustificationTypeFormValues
}
