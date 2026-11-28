import { requireCompany } from '@/entry/session'
import { scheduleReportModel } from '@/models/schedule-report/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'

import type { TScheduleReportPageData } from './_components/types'
import { getReportVersion } from './_components/utils'

export const getScheduleReportPageData = async (searchParameters: {
  initialMonth?: string
  finalMonth?: string
  limit?: string
  version?: string
}): Promise<TScheduleReportPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const period = scheduleReportModel.resolvePeriod(searchParameters)
  const [{ report, rules, restrictions }, shiftPatterns] = await Promise.all([
    scheduleReportModel.findReport({ companyId, ...period }),
    shiftPatternModel.findManyByCompanyId(companyId)
  ])
  const patternNames = new Map(shiftPatterns.map(({ id, name }) => [id, name]))
  return {
    period,
    version: getReportVersion(searchParameters.version),
    report,
    rules: rules.map((rule) => ({
      ...rule,
      shiftPatternNames: rule.shiftPatterns
        .map(({ shiftPatternId }) => patternNames.get(shiftPatternId) ?? '')
        .filter(Boolean)
        .toSorted((a, b) => a.localeCompare(b, 'pt-BR'))
    })),
    restrictions,
    canEdit
  }
}
