import { requireCompany } from '@/entry/session'
import { holidayModel } from '@/models/holiday/model'
import type { THolidayInYear } from '@/models/holiday/types'

type THolidaysPageData = {
  year: number
  holidays: THolidayInYear[]
}

export const getHolidaysPageData = async (searchParameters: {
  year?: string
}): Promise<THolidaysPageData> => {
  const {
    company: { id: companyId }
  } = await requireCompany()
  const year = holidayModel.resolveYear(searchParameters.year)
  const holidays = await holidayModel.findManyByYear({ companyId, year })
  return { year, holidays }
}
