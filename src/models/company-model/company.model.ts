import { Company } from '@prisma/client'

import { prisma } from '@/infra/prisma'
import { TInputData } from '@/types'

import { schema } from './schema'

const upsert = async (data: TInputData<Company>): Promise<Company> => {
  const company = schema.parse(data)
  const result = await prisma.company.upsert({
    where: { cpfCnpj: company.cpfCnpj },
    update: company,
    create: company
  })
  return result
}

export const companyModel = {
  upsert
}
