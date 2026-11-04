import { prisma } from '@/infra/database/client'
import type { DeviceSession } from '@/infra/database/generated/client'

const upsert = async (
  token: string,
  deviceCredentialsId: string
): Promise<DeviceSession> => {
  const result = await prisma.deviceSession.upsert({
    where: {
      deviceCredentialsId
    },
    update: {
      token
    },
    create: {
      token,
      deviceCredentialsId
    }
  })
  return result
}

const findUniqueByDeviceCredentialsId = async (
  deviceCredentialsId: string
): Promise<DeviceSession | null> => {
  const result = await prisma.deviceSession.findUnique({
    where: {
      deviceCredentialsId
    }
  })
  return result
}

export const deviceSessionModel = {
  upsert,
  findUniqueByDeviceCredentialsId
}
