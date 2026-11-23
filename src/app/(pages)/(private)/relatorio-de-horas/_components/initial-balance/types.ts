import type { TReportImportState } from '@/app/components/blocks/report-import-form'
import type { TReportPeriod } from '@/models/time-card-report/types'

export type TInitialBalanceState = TReportImportState & {
  data?: TReportPeriod & { unmatchedNames: string[] }
}
