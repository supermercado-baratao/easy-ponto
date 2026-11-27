import type { TTimeField } from '@/constants/time'
import type { TState } from '@/entry/form-action'
import type { TShiftAdjustmentSaveData } from '@/models/shift-assignment/types'

export type TDayFormValues = Partial<
  Record<
    | 'userId'
    | 'date'
    | 'adjustmentId'
    | 'kind'
    | 'shiftAssignmentId'
    | TTimeField,
    string
  >
>

export type TDayFormState = Omit<
  TState<TShiftAdjustmentSaveData, never>,
  'data'
> & {
  values?: TDayFormValues
  changed?: boolean
}
