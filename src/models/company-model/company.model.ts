import { Company } from '@prisma/client'

import { prisma } from '@/infra/prisma'

import { updateSchema, upsertSchema } from './schema'
import { TCompanyUpdateData, TCompanyUpsertData } from './types'

const upsert = async (data: TCompanyUpsertData): Promise<Company> => {
  const company = upsertSchema.parse(data)
  const result = await prisma.company.upsert({
    where: { cpfCnpj: company.cpfCnpj },
    update: company,
    create: company
  })
  return result
}

const update = async (data: TCompanyUpdateData): Promise<Company> => {
  const company = updateSchema.parse(data)
  const result = await prisma.company.update({
    where: { id: company.id },
    data: company
  })
  return result
}

export const companyModel = {
  upsert,
  update
}
