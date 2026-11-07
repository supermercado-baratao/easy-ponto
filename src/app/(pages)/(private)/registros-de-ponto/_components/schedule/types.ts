import type { TState } from '@/entry/form-action'
import type { TScheduleSaveData } from '@/models/schedule/types'
import type { TScheduleTimeFieldName } from '@/models/schedule/utils'

export type TScheduleFormValues = Partial<
  Record<'startDate' | TScheduleTimeFieldName, string>
>

export type TScheduleFormState = Omit<
  TState<TScheduleSaveData, never>,
  'data'
> & {
  values?: TScheduleFormValues
}
