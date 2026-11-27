import { wallClockNow } from '@/infra/dayjs'
import { holidayModel } from '@/models/holiday/model'
import { findHoliday } from '@/models/holiday/utils'
import { journeyRulesModel } from '@/models/journey-rules/model'
import { justificationModel } from '@/models/justification/model'
import { coversDate } from '@/models/justification/utils'
import { punchRecordModel } from '@/models/punch-record/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'

import type {
  TJourneyCalculateDaysParams,
  TJourneyDay,
  TJourneyFindUserDaysParams,
  TJourneyUserDays
} from './types'
import { calculateDay, getOvertimePercentages } from './utils'

const calculateDays = ({
  days,
  shiftDays,
  holidays,
  justifications,
  rules,
  today = wallClockNow().format('YYYY-MM-DD')
}: TJourneyCalculateDaysParams): TJourneyDay[] =>
  days.map((day) => ({
    ...day,
    journey: calculateDay({
      ...day,
      shiftDay: shiftDays.find(({ date }) => date === day.date) ?? null,
      holiday: findHoliday(day.date, holidays) ?? null,
      justifications: justifications.filter((justification) =>
        coversDate(justification, day.date)
      ),
      rules,
      today
    })
  }))

const findUserDays = async ({
  companyId,
  user,
  initialDate,
  finalDate
}: TJourneyFindUserDaysParams): Promise<TJourneyUserDays> => {
  const period = { initialDate, finalDate }
  const [punchRecordDays, shiftDays, justifications, holidays, rules] =
    await Promise.all([
      punchRecordModel.findManyByDay({ companyId, pis: user.pis, ...period }),
      shiftAssignmentModel.findUserDays({
        companyId,
        userId: user.id,
        ...period
      }),
      justificationModel.findManyInPeriod({ userId: user.id, ...period }),
      holidayModel.findManyByCompanyId(companyId),
      journeyRulesModel.findByCompanyId(companyId)
    ])
  const days = calculateDays({
    days: punchRecordDays,
    shiftDays,
    holidays,
    justifications,
    rules
  })
  return {
    days,
    justifications,
    overtimePercentages: getOvertimePercentages({
      overtimeBands: rules.overtimeBands,
      overtimes: days.map(({ journey }) => journey.overtime)
    })
  }
}

export const journeyModel = { calculateDays, findUserDays }
