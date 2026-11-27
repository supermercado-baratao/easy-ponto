import { wallClockNow } from '@/infra/dayjs'
import { holidayModel } from '@/models/holiday/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { userModel } from '@/models/user/model'

import { findMonthSchema, monthSchema } from './schema'
import type { TCalendarMonth, TWorkloadCalendarFindMonthParams } from './types'
import {
  buildCalendarDays,
  buildCalendarWeeks,
  getMonthPeriod,
  summarizeCalendarDays
} from './utils'

const resolveMonth = (month?: string): string =>
  monthSchema.safeParse(month).data ?? wallClockNow().format('YYYY-MM')

const findMonth = async (
  params: TWorkloadCalendarFindMonthParams
): Promise<TCalendarMonth> => {
  const { companyId, month, userId } = findMonthSchema.parse(params)
  const { initialDate, finalDate } = getMonthPeriod(month)
  const [users, companyDays, holidays] = await Promise.all([
    userModel.findManyByCompanyId(companyId),
    shiftAssignmentModel.findCompanyDays({ companyId, initialDate, finalDate }),
    holidayModel.findManyByYear({ companyId, year: month.slice(0, 4) })
  ])
  const monthHolidays = holidays.filter(({ dateInYear }) =>
    dateInYear.startsWith(month)
  )
  const calendars = companyDays.map(({ userId, assignments, days }) => ({
    userId,
    assignments,
    days: buildCalendarDays({ days, holidays: monthHolidays, adjustments: [] })
  }))
  const summaries = calendars.map(({ userId, assignments, days }) => ({
    userId,
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
    ],
    ...summarizeCalendarDays(days)
  }))

  const user = users.find(({ id }) => id === userId)
  const calendar = calendars.find((calendar) => calendar.userId === userId)
  if (!user || !calendar) return { month, users, summaries, selected: null }

  const adjustments = await shiftAssignmentModel.findAdjustmentsByUserId({
    userId: user.id,
    companyId
  })
  const days = buildCalendarDays({
    days: companyDays.find((days) => days.userId === user.id)!.days,
    holidays: monthHolidays,
    adjustments: adjustments.filter(({ date }) => date.startsWith(month))
  })
  return {
    month,
    users,
    summaries,
    selected: {
      user,
      weeks: buildCalendarWeeks(days),
      summary: summarizeCalendarDays(days),
      assignments: calendar.assignments
    }
  }
}

export const workloadCalendarModel = {
  resolveMonth,
  findMonth
}
