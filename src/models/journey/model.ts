import { wallClockNow } from '@/infra/dayjs'
import { holidayModel } from '@/models/holiday/model'
import { findHoliday } from '@/models/holiday/utils'
import { justificationModel } from '@/models/justification/model'
import { coversDate } from '@/models/justification/utils'
import { punchRecordModel } from '@/models/punch-record/model'
import { scheduleModel } from '@/models/schedule/model'

import type {
  TJourneyCalculateDaysParams,
  TJourneyDay,
  TJourneyFindUserDaysParams,
  TJourneyUserDays
} from './types'
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

const findUserDays = async ({
  companyId,
  user,
  initialDate,
  finalDate
}: TJourneyFindUserDaysParams): Promise<TJourneyUserDays> => {
  const period = { initialDate, finalDate }
  const [punchRecordDays, schedules, justifications, holidays] =
    await Promise.all([
      punchRecordModel.findManyByDay({ companyId, pis: user.pis, ...period }),
      scheduleModel.findManyInPeriod({ userId: user.id, ...period }),
      justificationModel.findManyInPeriod({ userId: user.id, ...period }),
      holidayModel.findManyByCompanyId(companyId)
    ])
  return {
    days: calculateDays({
      days: punchRecordDays,
      schedules,
      holidays,
      justifications
    }),
    schedules,
    justifications
  }
}

export const journeyModel = { calculateDays, findUserDays }
