import type { DeviceSession } from '@/infra/database/types'
import { deviceSessionRepository } from '@/repositories/device-session-repository'

const upsert = async (
  token: string,
  deviceCredentialsId: string
): Promise<DeviceSession> =>
  await deviceSessionRepository.upsert(token, deviceCredentialsId)

const findUniqueByDeviceCredentialsId = async (
  deviceCredentialsId: string
): Promise<DeviceSession | null> =>
  await deviceSessionRepository.findUniqueByDeviceCredentialsId(
    deviceCredentialsId
  )

export const deviceSessionModel = {
  upsert,
  findUniqueByDeviceCredentialsId
}
