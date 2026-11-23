import type { TState } from '@/entry/form-action'
import type { TReportPeriod } from '@/models/time-card-report/types'

export type TInitialBalanceState = Pick<
  TState<never, TReportPeriod & { unmatchedNames: string[] }>,
  'success' | 'fatalError' | 'message' | 'data'
> & {
  action?: string
}
