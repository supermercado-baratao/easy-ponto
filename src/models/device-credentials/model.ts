import type { DeviceCredentials, TInputData } from '@/infra/database/types'
import { deviceCredentialsRepository } from '@/repositories/device-credentials-repository'

import { schema } from './schema'

const upsert = async (
  data: TInputData<DeviceCredentials> & { adminUserId: string }
): Promise<DeviceCredentials> => {
  const { adminUserId, id, ...deviceData } = schema.parse(data)
  return await deviceCredentialsRepository.upsertForAdminUser({
    id,
    adminUserId,
    data: deviceData
  })
}

export const deviceCredentialsModel = {
  upsert
}
