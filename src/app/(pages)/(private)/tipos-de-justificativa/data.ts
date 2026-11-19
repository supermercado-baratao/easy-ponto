import { requireCompany } from '@/entry/session'
import type { JustificationType } from '@/infra/database/types'
import { justificationTypeModel } from '@/models/justification-type/model'

export const getJustificationTypesPageData = async (): Promise<{
  types: JustificationType[]
  canEdit: boolean
}> => {
  const { company, canEdit } = await requireCompany()
  return {
    types: await justificationTypeModel.findManyByCompanyId(company.id),
    canEdit
  }
}
