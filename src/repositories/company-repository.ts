import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { companies } from '@/infra/database/schema'
import type { Company, TInputData } from '@/infra/database/types'

type TCompanyUpsert = Omit<TInputData<Company>, 'registration'> &
  Partial<Pick<Company, 'registration'>>

export const companyRepository = {
  upsert: async (company: TCompanyUpsert): Promise<Company> => {
    const [upserted] = await database
      .insert(companies)
      .values(company)
      .onConflictDoUpdate({ target: companies.cpfCnpj, set: company })
      .returning()
    return upserted
  },

  update: async (
    id: string,
    company: Partial<TInputData<Company>>
  ): Promise<Company | null> => {
    const [updated = null] = await database
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning()
    return updated
  }
}
