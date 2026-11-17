import type { Dayjs } from 'dayjs'

import { dayjs } from '@/infra/dayjs'
import type { THolidayInYear } from '@/models/holiday/types'
import {
  MID_MONTH_FIRST_DAY,
  MID_MONTH_LAST_DAY,
  PEAK_WORKLOAD,
  STANDARD_WORKLOAD
} from '@/models/journey/utils'

import type { TWorkloadCalendar, TWorkloadDay, TWorkloadWeek } from './types'

const DAYS_IN_A_WEEK = 7

const sumWorkload = (days: (TWorkloadDay | null)[]): number =>
  days.reduce((total, day) => total + (day?.workload ?? 0), 0)

const buildDay = (date: Dayjs, holidays: Map<string, string>): TWorkloadDay => {
  const isoDate = date.format('YYYY-MM-DD')
  const day = date.date()
  const isSunday = date.day() === 0
  const holidayName = holidays.get(isoDate) ?? null
  const midMonth = day >= MID_MONTH_FIRST_DAY && day <= MID_MONTH_LAST_DAY
  const workload = midMonth ? STANDARD_WORKLOAD : PEAK_WORKLOAD
  return {
    date: isoDate,
    day,
    isSunday,
    holidayName,
    workload: isSunday || holidayName ? 0 : workload
  }
}

export const buildMonthCalendar = ({
  month,
  holidays
}: {
  month: string
  holidays: Pick<THolidayInYear, 'dateInYear' | 'name'>[]
}): TWorkloadCalendar => {
  const firstDay = dayjs(`${month}-01`)
  const holidaysByDate = new Map(
    holidays.map(({ dateInYear, name }) => [dateInYear, name])
  )
  const days = Array.from({ length: firstDay.daysInMonth() }, (_, index) =>
    buildDay(firstDay.add(index, 'day'), holidaysByDate)
  )
  const slots = [...Array.from({ length: firstDay.day() }, () => null), ...days]
  const weeks: TWorkloadWeek[] = Array.from(
    { length: Math.ceil(slots.length / DAYS_IN_A_WEEK) },
    (_, index) => {
      const week = slots.slice(
        index * DAYS_IN_A_WEEK,
        (index + 1) * DAYS_IN_A_WEEK
      )
      const padded = [
        ...week,
        ...Array.from({ length: DAYS_IN_A_WEEK - week.length }, () => null)
      ]
      return { days: padded, total: sumWorkload(padded) }
    }
  )
  const workedDays = days.filter(({ workload }) => workload > 0).length
  const total = sumWorkload(days)
  const standardJourney = workedDays * STANDARD_WORKLOAD
  return {
    month,
    weeks,
    workedDays,
    total,
    standardJourney,
    excess: total - standardJourney
  }
}
