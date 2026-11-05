import { database } from '@/infra/database/client'
import type { Company, TInputData } from '@/infra/database/types'

type TCompanyUpsert = Omit<TInputData<Company>, 'registration'> &
  Partial<Pick<Company, 'registration'>>

const companies = database.orm.public.Company

export const companyRepository = {
  upsert: async (company: TCompanyUpsert): Promise<Company> =>
    await companies.upsert({
      create: company,
      update: company,
      conflictOn: { cpfCnpj: company.cpfCnpj }
    }),

  update: async (
    id: string,
    company: Partial<TInputData<Company>>
  ): Promise<Company | null> => await companies.where({ id }).update(company)
}
