import { getAdminUser } from '@/entry/admin-user'
import type { JustificationType } from '@/infra/database/types'
import { justificationTypeModel } from '@/models/justification-type/model'
import { vacationPlanModel } from '@/models/vacation-plan/model'
import type {
  TVacationMonth,
  TVacationPlanRow
} from '@/models/vacation-plan/types'
import { groupByMonth } from '@/models/vacation-plan/utils'

type TVacationsPageData = {
  hasCompany: boolean
  year: number
  rows: TVacationPlanRow[]
  months: TVacationMonth[]
  types: JustificationType[]
}

export const getVacationsPageData = async (searchParameters: {
  year?: string
}): Promise<TVacationsPageData> => {
  const { companyId } = await getAdminUser()
  const year = vacationPlanModel.resolveYear(searchParameters.year)
  if (!companyId) {
    return { hasCompany: false, year, rows: [], months: [], types: [] }
  }

  const rows = await vacationPlanModel.findManyByYear({ companyId, year })
  return {
    hasCompany: true,
    year,
    rows,
    months: groupByMonth(rows),
    types: await justificationTypeModel.findManyByCompanyId(companyId)
  }
}
