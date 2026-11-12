import { getAdminUser } from '@/entry/admin-user'
import type { JustificationType } from '@/infra/database/types'
import { justificationTypeModel } from '@/models/justification-type/model'

type TJustificationTypesPageData = {
  hasCompany: boolean
  types: JustificationType[]
}

export const getJustificationTypesPageData =
  async (): Promise<TJustificationTypesPageData> => {
    const { companyId } = await getAdminUser()
    const types = companyId
      ? await justificationTypeModel.findManyByCompanyId(companyId)
      : []
    return { hasCompany: !!companyId, types }
  }
