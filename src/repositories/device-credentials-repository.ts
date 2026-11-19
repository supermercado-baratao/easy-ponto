import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { companies, devicesCredentials } from '@/infra/database/schema'
import type { DeviceCredentials, TInputData } from '@/infra/database/types'

export const deviceCredentialsRepository = {
  upsertForCompany: async ({
    id,
    companyId,
    data
  }: {
    id?: string
    companyId: string
    data: TInputData<DeviceCredentials>
  }): Promise<DeviceCredentials> =>
    await database.transaction(async (tx) => {
      const [updated] = id
        ? await tx
            .update(devicesCredentials)
            .set(data)
            .where(eq(devicesCredentials.id, id))
            .returning()
        : []
      const [credentials] = updated
        ? [updated]
        : await tx.insert(devicesCredentials).values(data).returning()

      const [company] = await tx
        .update(companies)
        .set({ deviceCredentialsId: credentials.id })
        .where(eq(companies.id, companyId))
        .returning({ id: companies.id })
      if (!company) throw new Error(`Company ${companyId} not found`)

      return credentials
    })
}
