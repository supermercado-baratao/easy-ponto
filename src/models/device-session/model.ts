import type { DeviceSession } from '@/infra/database/types'
import { deviceSessionRepo } from '@/repositories/device-session-repo'

const upsert = async (
  token: string,
  deviceCredentialsId: string
): Promise<DeviceSession> =>
  await deviceSessionRepo.upsert(token, deviceCredentialsId)

const findUniqueByDeviceCredentialsId = async (
  deviceCredentialsId: string
): Promise<DeviceSession | null> =>
  await deviceSessionRepo.findUniqueByDeviceCredentialsId(deviceCredentialsId)

export const deviceSessionModel = {
  upsert,
  findUniqueByDeviceCredentialsId
}
