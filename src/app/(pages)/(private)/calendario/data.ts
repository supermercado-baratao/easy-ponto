import { requireCompany } from '@/entry/session'
import { workloadCalendarModel } from '@/models/workload-calendar/model'
import type { TWorkloadCalendar } from '@/models/workload-calendar/types'

type TCalendarPageData = {
  month: string
  calendar: TWorkloadCalendar
}

export const getCalendarPageData = async (searchParameters: {
  month?: string
}): Promise<TCalendarPageData> => {
  const {
    company: { id: companyId }
  } = await requireCompany()
  const month = workloadCalendarModel.resolveMonth(searchParameters.month)
  return {
    month,
    calendar: await workloadCalendarModel.findMonth({ companyId, month })
  }
}
