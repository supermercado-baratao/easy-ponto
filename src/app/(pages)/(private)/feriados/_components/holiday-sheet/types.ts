import type { TState } from '@/entry/form-action'
import type { THolidayUpdateData } from '@/models/holiday/types'

export type THolidayFormValues = Partial<
  Record<'id' | 'date' | 'name' | 'scope' | 'recurring', string>
>

export type THolidayFormState = Omit<
  TState<THolidayUpdateData, never>,
  'data'
> & {
  values?: THolidayFormValues
}
