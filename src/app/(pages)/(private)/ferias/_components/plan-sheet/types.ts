import type { TState } from '@/entry/form-action'
import type { TVacationPlanSaveData } from '@/models/vacation-plan/types'

export type TPlanFormValues = Partial<
  Record<'userId' | 'year' | 'month', string>
>

export type TPlanFormState = Omit<
  TState<TVacationPlanSaveData, never>,
  'data'
> & {
  values?: TPlanFormValues
}
