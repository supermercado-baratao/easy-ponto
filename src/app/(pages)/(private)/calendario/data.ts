import { getAdminUser } from '@/entry/admin-user'
import { workloadCalendarModel } from '@/models/workload-calendar/model'
import type { TWorkloadCalendar } from '@/models/workload-calendar/types'

type TCalendarPageData = {
  month: string
  calendar: TWorkloadCalendar | null
}

export const getCalendarPageData = async (searchParameters: {
  month?: string
}): Promise<TCalendarPageData> => {
  const { companyId } = await getAdminUser()
  const month = workloadCalendarModel.resolveMonth(searchParameters.month)
  return {
    month,
    calendar: companyId
      ? await workloadCalendarModel.findMonth({ companyId, month })
      : null
  }
}
