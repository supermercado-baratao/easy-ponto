import { eq } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { companies, justificationTypes } from '@/infra/database/schema'
import type {
  Company,
  JustificationType,
  TCompanyWithDeviceCredentials,
  TInputData
} from '@/infra/database/types'

type TCompanyInsert = Pick<Company, 'name' | 'slug'> &
  Partial<TInputData<Company>>

export type TCompanyCreateData = {
  company: TCompanyInsert
  justificationTypes: Omit<TInputData<JustificationType>, 'companyId'>[]
}

export const companyRepository = {
  create: async (
    { company, justificationTypes: types }: TCompanyCreateData,
    transaction?: TTransaction
  ): Promise<Company> =>
    await runInTransaction(transaction, async (tx) => {
      const [created] = await tx.insert(companies).values(company).returning()
      if (types.length > 0) {
        await tx
          .insert(justificationTypes)
          .values(types.map((type) => ({ ...type, companyId: created.id })))
      }
      return created
    }),

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
