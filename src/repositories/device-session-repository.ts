import { database } from '@/infra/database/client'
import type { DeviceSession } from '@/infra/database/types'

const deviceSessions = database.orm.public.DeviceSession

export const deviceSessionRepository = {
  upsert: async (
    token: string,
    deviceCredentialsId: string
  ): Promise<DeviceSession> =>
    await deviceSessions.upsert({
      create: { token, deviceCredentialsId },
      update: { token },
      conflictOn: { deviceCredentialsId }
    }),

  findUniqueByDeviceCredentialsId: async (
    deviceCredentialsId: string
  ): Promise<DeviceSession | null> =>
    await deviceSessions.whereUnique({ deviceCredentialsId }).first()
}
