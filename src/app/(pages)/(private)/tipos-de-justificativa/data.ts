import { requireCompany } from '@/entry/session'
import type { JustificationType } from '@/infra/database/types'
import { justificationTypeModel } from '@/models/justification-type/model'

export const getJustificationTypesPageData = async (): Promise<
  JustificationType[]
> => {
  const { company } = await requireCompany()
  return await justificationTypeModel.findManyByCompanyId(company.id)
}
