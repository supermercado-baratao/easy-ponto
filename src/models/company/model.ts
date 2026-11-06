import type { Company } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { companyRepository } from '@/repositories/company-repository'

import { updateSchema, upsertSchema } from './schema'
import {
  TCompanyUpdateData,
  TCompanyUpsertData,
  TCompanyUpsertForAdminUserData
} from './types'

const upsert = async (data: TCompanyUpsertData): Promise<Company> =>
  await companyRepository.upsert(upsertSchema.parse(data))

const upsertForAdminUser = async ({
  adminUserId,
  ...data
}: TCompanyUpsertForAdminUserData): Promise<Company> => {
  const company = await upsert(data)
  await adminUserModel.update({ id: adminUserId, companyId: company.id })
  return company
}

const update = async (data: TCompanyUpdateData): Promise<Company> => {
  const { id, ...company } = updateSchema.parse(data)
  const result = await companyRepository.update(id, company)
  if (!result) throw new Error(`Company ${id} not found`)
  return result
}

export const companyModel = {
  upsert,
  upsertForAdminUser,
  update
}
