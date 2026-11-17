import { z } from 'zod'

import { findMonthSchema } from './schema'

export type TWorkloadCalendarFindMonthParams = z.input<typeof findMonthSchema>

export type TWorkloadDay = {
  date: string
  day: number
  workload: number
  isSunday: boolean
  holidayName: string | null
}

export type TWorkloadWeek = {
  days: (TWorkloadDay | null)[]
  total: number
}

export type TWorkloadCalendar = {
  month: string
  weeks: TWorkloadWeek[]
  workedDays: number
  total: number
  standardJourney: number
  excess: number
}
