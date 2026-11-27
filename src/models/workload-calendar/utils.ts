import type { ShiftAdjustment } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { THolidayInYear } from '@/models/holiday/types'
import type { TResolvedDay } from '@/models/shift-assignment/utils'

import type { TCalendarDay, TCalendarSummary, TCalendarWeek } from './types'

const DAYS_IN_A_WEEK = 7

const DATE_FORMAT = 'YYYY-MM-DD'

export const getMonthPeriod = (
  month: string
): { initialDate: string; finalDate: string } => {
  const firstDay = dayjs(`${month}-01`)
  return {
    initialDate: firstDay.format(DATE_FORMAT),
    finalDate: firstDay.endOf('month').format(DATE_FORMAT)
  }
}

const sumPairs = (pairs: TResolvedDay['pairs']): number =>
  pairs.reduce((total, { entry, exit }) => total + exit - entry, 0)

// A holiday has no expected hours in the journey, so its load is zero even on a workday of the schedule
export const buildCalendarDays = ({
  days,
  holidays,
  adjustments
}: {
  days: TResolvedDay[]
  holidays: Pick<THolidayInYear, 'dateInYear' | 'name'>[]
  adjustments: ShiftAdjustment[]
}): TCalendarDay[] => {
  const holidaysByDate = new Map(
    holidays.map(({ dateInYear, name }) => [dateInYear, name])
  )
  return days.map(({ date, kind, pairs, adjusted }) => {
    const holidayName = holidaysByDate.get(date) ?? null
    return {
      date,
      day: dayjs(date).date(),
      kind,
      pairs,
      adjusted,
      holidayName,
      workload: holidayName ? 0 : sumPairs(pairs),
      adjustment:
        adjustments.find((adjustment) => adjustment.date === date) ?? null
    }
  })
}

export const buildCalendarWeeks = (days: TCalendarDay[]): TCalendarWeek[] => {
  if (days.length === 0) return []
  const slots: TCalendarWeek = [
    ...Array.from({ length: dayjs(days[0].date).day() }, () => null),
    ...days
  ]
  return Array.from(
    { length: Math.ceil(slots.length / DAYS_IN_A_WEEK) },
    (_, index) => {
      const week = slots.slice(
        index * DAYS_IN_A_WEEK,
        (index + 1) * DAYS_IN_A_WEEK
      )
      return [
        ...week,
        ...Array.from({ length: DAYS_IN_A_WEEK - week.length }, () => null)
      ]
    }
  )
}

export const summarizeCalendarDays = (
  days: TCalendarDay[]
): TCalendarSummary => ({
  workdays: days.filter(
    ({ kind, holidayName }) => kind === 'work' && !holidayName
  ).length,
  daysOff: days.filter(
    ({ kind, holidayName }) => kind === 'off' && !holidayName
  ).length,
  holidays: days.filter(({ holidayName }) => holidayName).length,
  adjustments: days.filter(({ adjusted }) => adjusted).length,
  workload: days.reduce((total, { workload }) => total + workload, 0)
})
