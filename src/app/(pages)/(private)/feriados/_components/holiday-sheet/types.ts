import type { TState } from '@/entry/form-action'

export type THolidayFormValues = Partial<
  Record<
    | 'id'
    | 'date'
    | 'name'
    | 'scope'
    | 'recurrence'
    | 'easterDays'
    | 'easterSide'
    | 'firstYear'
    | 'lastYear'
    | 'fromYear',
    string
  >
>

export type THolidayFormState = Omit<
  TState<Required<THolidayFormValues>, never>,
  'data'
> & {
  values?: THolidayFormValues
}
