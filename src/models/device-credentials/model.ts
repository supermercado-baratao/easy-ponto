import { db } from '@/infra/database/client'
import type { DeviceCredentials, TInputData } from '@/infra/database/types'

import { schema } from './schema'

const upsert = async (
  data: TInputData<DeviceCredentials> & { adminUserId: string }
): Promise<DeviceCredentials> => {
  const parsedData = schema.parse(data)
  const { adminUserId, id, ...deviceData } = parsedData

  return await db.transaction(async (tx) => {
    const updated = id
      ? await tx.orm.public.DeviceCredentials.where({ id }).update(deviceData)
      : null
    const credentials =
      updated ?? (await tx.orm.public.DeviceCredentials.create(deviceData))

    const adminUser = await tx.orm.public.AdminUser.where({
      id: adminUserId
    }).update({ deviceCredentialsId: credentials.id })
    if (!adminUser) throw new Error(`AdminUser ${adminUserId} not found`)

    return credentials
  })
}

export const deviceCredentialsModel = {
  upsert
}
