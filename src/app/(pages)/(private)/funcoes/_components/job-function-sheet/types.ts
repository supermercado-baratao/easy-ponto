import type { TState } from '@/entry/form-action'
import type { TJobFunctionUpdateData } from '@/models/job-function/types'

export type TJobFunctionFormValues = Partial<
  Record<'id' | 'name' | 'description' | 'level', string>
>

export type TJobFunctionFormState = Omit<
  TState<TJobFunctionUpdateData, never>,
  'data'
> & {
  values?: TJobFunctionFormValues
}
