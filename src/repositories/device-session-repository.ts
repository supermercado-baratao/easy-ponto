import { database } from '@/infra/database/client'
import { devicesSessions } from '@/infra/database/schema'
import type { DeviceSession } from '@/infra/database/types'

export const deviceSessionRepository = {
  upsert: async (
    token: string,
    deviceCredentialsId: string
  ): Promise<DeviceSession> => {
    const [session] = await database
      .insert(devicesSessions)
      .values({ token, deviceCredentialsId })
      .onConflictDoUpdate({
        target: devicesSessions.deviceCredentialsId,
        set: { token }
      })
      .returning()
    return session
  },

  findUniqueByDeviceCredentialsId: async (
    deviceCredentialsId: string
  ): Promise<DeviceSession | null> =>
    (await database.query.devicesSessions.findFirst({
      where: { deviceCredentialsId }
    })) ?? null
}
