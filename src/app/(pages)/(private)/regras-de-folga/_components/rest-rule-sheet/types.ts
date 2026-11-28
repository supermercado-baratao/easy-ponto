import type { TState } from '@/entry/form-action'
import type { TRestRuleUpdateData } from '@/models/rest-rule/types'
import type { TRestConstraintField } from '@/models/rest-rule/utils'

type TTextField =
  | 'id'
  | 'name'
  | 'windowStartDay'
  | 'windowEndDay'
  | 'distances'
  | 'holidayRest'
  | TRestConstraintField

export type TRestRuleFormValues = Partial<Record<TTextField, string>> & {
  shiftPatternIds?: string[]
  blockedWeekdays?: string[]
}

export type TRestRuleFormState = Omit<
  TState<TRestRuleUpdateData, never>,
  'data'
> & {
  values?: TRestRuleFormValues
}
