import { db } from '@/infra/database/client'
import type { Company } from '@/infra/database/types'

import { updateSchema, upsertSchema } from './schema'
import { TCompanyUpdateData, TCompanyUpsertData } from './types'

const upsert = async (data: TCompanyUpsertData): Promise<Company> => {
  const company = upsertSchema.parse(data)
  const result = await db.orm.public.Company.upsert({
    create: company,
    update: company,
    conflictOn: { cpfCnpj: company.cpfCnpj }
  })
  return result
}

const update = async (data: TCompanyUpdateData): Promise<Company> => {
  const { id, ...company } = updateSchema.parse(data)
  const result = await db.orm.public.Company.where({ id }).update(company)
  if (!result) throw new Error(`Company ${id} not found`)
  return result
}

export const companyModel = {
  upsert,
  update
}
