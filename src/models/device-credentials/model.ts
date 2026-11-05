import type { DeviceCredentials, TInputData } from '@/infra/database/types'
import { deviceCredentialsRepo } from '@/repositories/device-credentials-repo'

import { schema } from './schema'

const upsert = async (
  data: TInputData<DeviceCredentials> & { adminUserId: string }
): Promise<DeviceCredentials> => {
  const { adminUserId, id, ...deviceData } = schema.parse(data)
  return await deviceCredentialsRepo.upsertForAdminUser({
    id,
    adminUserId,
    data: deviceData
  })
}

export const deviceCredentialsModel = {
  upsert
}
