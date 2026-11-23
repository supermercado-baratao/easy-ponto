import type { TActionState } from '@/entry/action'
import type { TReportPeriod } from '@/models/time-card-report/types'

export type TInitialBalanceState = TActionState<
  TReportPeriod & { unmatchedNames: string[] }
>
