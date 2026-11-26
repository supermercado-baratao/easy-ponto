import type { TState } from '@/entry/form-action'
import type { TShiftPatternUpdateData } from '@/models/shift-pattern/types'
import type { TShiftPatternTimeFieldName } from '@/models/shift-pattern/utils'

export type TShiftPatternFormValues = Partial<
  Record<
    | 'id'
    | 'versionId'
    | 'name'
    | 'startDate'
    | 'cycleLength'
    | TShiftPatternTimeFieldName,
    string
  >
>

// The day fields are a template literal pattern, which the errors keyed by the model input leave out
export type TShiftPatternFormState = Omit<
  TState<TShiftPatternUpdateData, never>,
  'data' | 'errors'
> & {
  errors?: Partial<Record<keyof TShiftPatternFormValues | 'companyId', string>>
  values?: TShiftPatternFormValues
}

export type TShiftPatternSheetMode = 'create' | 'new-version' | 'edit-version'
