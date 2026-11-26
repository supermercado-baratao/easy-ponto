import type { TActionState } from '@/entry/action'
import type { TState } from '@/entry/form-action'
import type { TShiftAssignmentUpdateData } from '@/models/shift-assignment/types'

export type TShiftAssignmentFormValues = Partial<
  Record<
    | 'id'
    | 'userId'
    | 'shiftPatternId'
    | 'startDate'
    | 'endDate'
    | 'cycleStartDay',
    string
  >
>

export type TShiftAssignmentFormState = Omit<
  TState<TShiftAssignmentUpdateData, never>,
  'data'
> & {
  values?: TShiftAssignmentFormValues
}

export type TRemoveState = TActionState<null>
