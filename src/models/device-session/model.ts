import { db } from '@/infra/database/client'
import type { DeviceSession } from '@/infra/database/types'

const deviceSessions = db.orm.public.DeviceSession

const upsert = async (
  token: string,
  deviceCredentialsId: string
): Promise<DeviceSession> => {
  const result = await deviceSessions.upsert({
    create: { token, deviceCredentialsId },
    update: { token },
    conflictOn: { deviceCredentialsId }
  })
  return result
}

const findUniqueByDeviceCredentialsId = async (
  deviceCredentialsId: string
): Promise<DeviceSession | null> => {
  const result = await deviceSessions
    .whereUnique({ deviceCredentialsId })
    .first()
  return result
}

export const deviceSessionModel = {
  upsert,
  findUniqueByDeviceCredentialsId
}
