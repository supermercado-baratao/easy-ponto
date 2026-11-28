import type { TRestRuleWithRelations } from '@/infra/database/types'
import type { TRestRestrictionSummary } from '@/models/rest-restriction/utils'
import type { TScheduleReportPeriod } from '@/models/schedule-report/types'
import type { TScheduleReport } from '@/models/schedule-report/utils'

export type TReportVersion = 'full' | 'management'

export type TReportRule = TRestRuleWithRelations & {
  shiftPatternNames: string[]
}

export type TScheduleReportPageData = {
  period: TScheduleReportPeriod
  version: TReportVersion
  report: TScheduleReport
  rules: TReportRule[]
  restrictions: TRestRestrictionSummary[]
  canEdit: boolean
}
