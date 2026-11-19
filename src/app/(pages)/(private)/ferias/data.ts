import { requireCompany } from '@/entry/session'
import type { JustificationType } from '@/infra/database/types'
import { justificationTypeModel } from '@/models/justification-type/model'
import { vacationPlanModel } from '@/models/vacation-plan/model'
import type {
  TVacationMonth,
  TVacationPlanRow
} from '@/models/vacation-plan/types'
import { groupByMonth } from '@/models/vacation-plan/utils'

type TVacationsPageData = {
  year: number
  rows: TVacationPlanRow[]
  months: TVacationMonth[]
  types: JustificationType[]
}

export const getVacationsPageData = async (searchParameters: {
  year?: string
}): Promise<TVacationsPageData> => {
  const {
    company: { id: companyId }
  } = await requireCompany()
  const year = vacationPlanModel.resolveYear(searchParameters.year)
  const rows = await vacationPlanModel.findManyByYear({ companyId, year })
  return {
    year,
    rows,
    months: groupByMonth(rows),
    types: await justificationTypeModel.findManyByCompanyId(companyId)
  }
}
