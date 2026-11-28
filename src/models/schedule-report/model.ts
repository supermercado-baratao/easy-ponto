import type { TRestRuleWithRelations } from '@/infra/database/types'
import { dayjs, wallClockNow } from '@/infra/dayjs'
import { findHoliday } from '@/models/holiday/utils'
import {
  toRestRestrictionSummary,
  type TRestRestrictionSummary
} from '@/models/rest-restriction/utils'
import { restRuleModel } from '@/models/rest-rule/model'
import { toRestRuleInput } from '@/models/rest-rule/utils'
import { userGroupModel } from '@/models/user-group/model'

import { findReportSchema, limitSchema, monthSchema } from './schema'
import type { TScheduleReportFindParams, TScheduleReportPeriod } from './types'
import {
  buildScheduleReport,
  getReportMonths,
  MAX_REPORT_MONTHS,
  type TScheduleReport
} from './utils'

const MONTH_FORMAT = 'YYYY-MM'

const clampMonth = (month: string, min: string, max: string): string => {
  if (month < min) return min
  return month > max ? max : month
}

// The period comes from the URL, so an invalid one falls back to the months the rests are planned for
const resolvePeriod = (parameters: {
  initialMonth?: string
  finalMonth?: string
  limit?: string
}): TScheduleReportPeriod => {
  const today = wallClockNow()
  const initialMonth =
    monthSchema.safeParse(parameters.initialMonth).data ??
    today.format(MONTH_FORMAT)
  const lastMonth = dayjs(`${initialMonth}-01`)
    .add(MAX_REPORT_MONTHS - 1, 'month')
    .format(MONTH_FORMAT)
  const finalMonth =
    monthSchema.safeParse(parameters.finalMonth).data ??
    dayjs(`${initialMonth}-01`).add(1, 'month').format(MONTH_FORMAT)
  return {
    initialMonth,
    finalMonth: clampMonth(finalMonth, initialMonth, lastMonth),
    limit: parameters.limit?.trim()
      ? (limitSchema.safeParse(parameters.limit).data ?? null)
      : null
  }
}

const findReport = async (
  params: TScheduleReportFindParams
): Promise<{
  report: TScheduleReport
  rules: TRestRuleWithRelations[]
  restrictions: TRestRestrictionSummary[]
}> => {
  const { companyId, initialMonth, finalMonth, limit } =
    findReportSchema.parse(params)
  const months = getReportMonths(initialMonth, finalMonth)
  const [plan, groups, members] = await Promise.all([
    restRuleModel.planMonths({ companyId, months }),
    userGroupModel.findManyByCompanyId(companyId),
    userGroupModel.findMembersByCompanyId(companyId)
  ])
  const initialDate = plan.months[0].initialDate
  const finalDate = plan.months.at(-1)!.finalDate
  const report = buildScheduleReport({
    months: plan.months,
    users: plan.activeUsers.map(({ id, name }) => {
      const assignments = plan.months.flatMap(({ users }) =>
        users
          .filter(({ userId }) => userId === id)
          .flatMap(({ assignments }) => assignments)
      )
      return {
        id,
        name,
        groupIds: members
          .filter(({ userId }) => userId === id)
          .map(({ groupId }) => groupId),
        shiftPatternNames: [
          ...new Set(
            assignments
              .filter(
                ({ startDate, endDate }) =>
                  startDate <= finalDate &&
                  (endDate === null || endDate >= initialDate)
              )
              .map(({ shiftPattern }) => shiftPattern.name)
          )
        ].toSorted((a, b) => a.localeCompare(b, 'pt-BR'))
      }
    }),
    groups,
    rules: plan.rules.map((rule) => toRestRuleInput(rule)),
    restrictions: plan.restrictions,
    isHoliday: (date) => !!findHoliday(date, plan.holidays),
    limit
  })
  return {
    report,
    rules: plan.rules,
    restrictions: plan.restrictions.map((restriction) =>
      toRestRestrictionSummary(restriction)
    )
  }
}

export const scheduleReportModel = {
  resolvePeriod,
  findReport
}
