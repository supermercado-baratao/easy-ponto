import { wallClockNow } from '@/infra/dayjs'
import { holidayModel } from '@/models/holiday/model'

import { findMonthSchema, monthSchema } from './schema'
import type {
  TWorkloadCalendar,
  TWorkloadCalendarFindMonthParams
} from './types'
import { buildMonthCalendar } from './utils'

const resolveMonth = (month?: string): string =>
  monthSchema.safeParse(month).data ?? wallClockNow().format('YYYY-MM')

const findMonth = async (
  params: TWorkloadCalendarFindMonthParams
): Promise<TWorkloadCalendar> => {
  const { companyId, month } = findMonthSchema.parse(params)
  const holidays = await holidayModel.findManyByYear({
    companyId,
    year: month.slice(0, 4)
  })
  return buildMonthCalendar({
    month,
    holidays: holidays.filter(({ dateInYear }) => dateInYear.startsWith(month))
  })
}

export const workloadCalendarModel = {
  resolveMonth,
  findMonth
}
