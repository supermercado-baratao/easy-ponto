import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { adminUsers, devicesCredentials } from '@/infra/database/schema'
import type { DeviceCredentials, TInputData } from '@/infra/database/types'

export const deviceCredentialsRepository = {
  upsertForAdminUser: async ({
    id,
    adminUserId,
    data
  }: {
    id?: string
    adminUserId: string
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

      const [adminUser] = await tx
        .update(adminUsers)
        .set({ deviceCredentialsId: credentials.id })
        .where(eq(adminUsers.id, adminUserId))
        .returning()
      if (!adminUser) throw new Error(`AdminUser ${adminUserId} not found`)

      return credentials
    })
}
