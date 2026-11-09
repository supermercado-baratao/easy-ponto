import { getAdminUser } from '@/entry/admin-user'
import { holidayModel } from '@/models/holiday/model'
import type { THolidayInYear } from '@/models/holiday/types'

type THolidaysPageData = {
  hasCompany: boolean
  year: number
  holidays: THolidayInYear[]
}

export const getHolidaysPageData = async (searchParameters: {
  year?: string
}): Promise<THolidaysPageData> => {
  const { companyId } = await getAdminUser()
  const year = holidayModel.resolveYear(searchParameters.year)
  const holidays = companyId
    ? await holidayModel.findManyByYear({ companyId, year })
    : []
  return { hasCompany: !!companyId, year, holidays }
}
