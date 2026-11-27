import { requireMembership } from '@/entry/session'
import type { TJustificationWithType } from '@/infra/database/types'
import { journeyModel } from '@/models/journey/model'
import type { TJourneyDay, TJourneyTotals } from '@/models/journey/types'
import { sumDays } from '@/models/journey/utils'
import { punchRecordModel } from '@/models/punch-record/model'
import { userModel } from '@/models/user/model'
import { workloadCalendarModel } from '@/models/workload-calendar/model'

type TEmployeeHomePageData = {
  name: string
  companyName: string
  month: string
  journey: {
    days: TJourneyDay[]
    justifications: TJustificationWithType[]
    totals: TJourneyTotals
    overtimePercentages: number[]
  } | null
}

export const getEmployeeHomePageData = async (searchParameters: {
  month?: string
}): Promise<TEmployeeHomePageData> => {
  const { session, membership } = await requireMembership()
  const month = workloadCalendarModel.resolveMonth(searchParameters.month)
  const companyId = membership.company.id
  const user = await userModel.findByAuthUserId({
    companyId,
    authUserId: session.user.id
  })
  const header = {
    name: session.user.name,
    companyName: membership.company.name,
    month
  }
  if (!user) return { ...header, journey: null }

  const { days, justifications, overtimePercentages } =
    await journeyModel.findUserDays({
      companyId,
      user,
      ...punchRecordModel.getMonthPeriod(month)
    })
  return {
    ...header,
    journey: {
      days,
      justifications,
      totals: sumDays(days),
      overtimePercentages
    }
  }
}
