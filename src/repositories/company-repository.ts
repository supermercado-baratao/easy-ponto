import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { companies } from '@/infra/database/schema'
import type {
  Company,
  TCompanyWithDeviceCredentials,
  TInputData
} from '@/infra/database/types'

type TCompanyInsert = Pick<Company, 'name' | 'slug'> &
  Partial<TInputData<Company>>

export const companyRepository = {
  create: async (company: TCompanyInsert): Promise<Company> => {
    const [created] = await database
      .insert(companies)
      .values(company)
      .returning()
    return created
  },

  findUniqueById: async (
    id: string
  ): Promise<TCompanyWithDeviceCredentials | null> =>
    (await database.query.companies.findFirst({
      where: { id },
      with: { deviceCredentials: true }
    })) ?? null,

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
