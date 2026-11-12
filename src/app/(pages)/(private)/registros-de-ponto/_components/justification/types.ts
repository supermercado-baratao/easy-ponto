import type { TState } from '@/entry/form-action'
import type { TJustificationUpdateData } from '@/models/justification/types'

export type TJustificationFormValues = Partial<
  Record<
    | 'id'
    | 'typeId'
    | 'startDate'
    | 'endDate'
    | 'startTime'
    | 'endTime'
    | 'note',
    string
  >
>

export type TJustificationFormState = Omit<
  TState<TJustificationUpdateData, never>,
  'data'
> & {
  values?: TJustificationFormValues
}

export type TRemoveJustificationState = Pick<
  TState<never, never>,
  'success' | 'fatalError'
>
