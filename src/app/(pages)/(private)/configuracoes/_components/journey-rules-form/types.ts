import type { TState } from '@/entry/form-action'
import type { JourneyRules } from '@/infra/database/types'
import type { TJourneyRulesFormData } from '@/models/journey-rules/types'

export type TJourneyRulesFormValues = Partial<
  Record<Exclude<keyof TJourneyRulesFormData, 'companyId'>, string>
>

export type TJourneyRulesFormState = TState<
  TJourneyRulesFormData,
  JourneyRules
> & { values?: TJourneyRulesFormValues }
