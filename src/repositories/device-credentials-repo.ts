import { db } from '@/infra/database/client'
import type { DeviceCredentials, TInputData } from '@/infra/database/types'

export const deviceCredentialsRepo = {
  upsertForAdminUser: async ({
    id,
    adminUserId,
    data
  }: {
    id?: string
    adminUserId: string
    data: TInputData<DeviceCredentials>
  }): Promise<DeviceCredentials> =>
    await db.transaction(async (tx) => {
      const updated = id
        ? await tx.orm.public.DeviceCredentials.where({ id }).update(data)
        : null
      const credentials =
        updated ?? (await tx.orm.public.DeviceCredentials.create(data))

      const adminUser = await tx.orm.public.AdminUser.where({
        id: adminUserId
      }).update({ deviceCredentialsId: credentials.id })
      if (!adminUser) throw new Error(`AdminUser ${adminUserId} not found`)

      return credentials
    })
}
