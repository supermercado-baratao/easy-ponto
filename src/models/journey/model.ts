import { wallClockNow } from '@/infra/dayjs'
import { findHoliday } from '@/models/holiday/utils'
import { coversDate } from '@/models/justification/utils'

import type { TJourneyCalculateDaysParams, TJourneyDay } from './types'
import { calculateDay } from './utils'

const calculateDays = ({
  days,
  schedules,
  holidays,
  justifications,
  today = wallClockNow().format('YYYY-MM-DD')
}: TJourneyCalculateDaysParams): TJourneyDay[] => {
  const schedulesByStartDate = schedules.toSorted((first, second) =>
    second.startDate.localeCompare(first.startDate)
  )
  return days.map((day) => ({
    ...day,
    journey: calculateDay({
      ...day,
      schedule:
        schedulesByStartDate.find(({ startDate }) => startDate <= day.date) ??
        null,
      holiday: findHoliday(day.date, holidays) ?? null,
      justifications: justifications.filter((justification) =>
        coversDate(justification, day.date)
      ),
      today
    })
  }))
}

export const journeyModel = { calculateDays }
