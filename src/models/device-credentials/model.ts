import type { DeviceCredentials } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { deviceCredentialsRepository } from '@/repositories/device-credentials-repository'

import { schema } from './schema'
import { TDeviceCredentialsUpsertData } from './types'

const upsert = async ({
  adminUserId,
  ...data
}: TDeviceCredentialsUpsertData): Promise<DeviceCredentials> => {
  const { deviceCredentials } = await adminUserModel.findUniqueById(adminUserId)
  const { id, ...deviceData } = schema.parse({
    ...data,
    id: deviceCredentials?.id,
    password: data.password || deviceCredentials?.password
  })
  return await deviceCredentialsRepository.upsertForAdminUser({
    id,
    adminUserId,
    data: deviceData
  })
}

export const deviceCredentialsModel = {
  upsert
}
