import { DeviceCredentials } from '@prisma/client'

import { prisma } from '@/infra/prisma'
import { TInputData } from '@/types'

import { schema } from './schema'

const upsert = async (
  data: TInputData<DeviceCredentials> & { adminUserId: string }
): Promise<DeviceCredentials> => {
  const parsedData = schema.parse(data)
  const { adminUserId, id, ...deviceData } = parsedData

  const def = {
    ...deviceData,
    adminUsers: {
      connect: {
        id: adminUserId
      }
    }
  }
  const result = await prisma.deviceCredentials.upsert({
    create: def,
    update: def,
    where: {
      id: id ?? ''
    }
  })
  return result
}

export const deviceCredentialsModel = {
  upsert
}
