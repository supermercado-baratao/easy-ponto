import type { TState } from '@/entry/form-action'
import type { TVacationPlanRegisterJustificationData } from '@/models/vacation-plan/types'

export type TRegisterFormValues = Partial<
  Record<
    'userId' | 'year' | 'typeId' | 'startDate' | 'endDate' | 'note',
    string
  >
>

export type TRegisterFormState = Omit<
  TState<TVacationPlanRegisterJustificationData, never>,
  'data'
> & {
  values?: TRegisterFormValues
}
