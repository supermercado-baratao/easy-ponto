import type { Company } from '@/infra/database/types'
import { companyRepository } from '@/repositories/company-repository'

import { updateSchema, upsertSchema } from './schema'
import { TCompanyUpdateData, TCompanyUpsertData } from './types'

const upsert = async (data: TCompanyUpsertData): Promise<Company> =>
  await companyRepository.upsert(upsertSchema.parse(data))

const update = async (data: TCompanyUpdateData): Promise<Company> => {
  const { id, ...company } = updateSchema.parse(data)
  const result = await companyRepository.update(id, company)
  if (!result) throw new Error(`Company ${id} not found`)
  return result
}

export const companyModel = {
  upsert,
  update
}
