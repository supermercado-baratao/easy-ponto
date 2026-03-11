import { DeviceCredentials } from '@prisma/client'

import { prisma } from '@/infra/prisma'
import { TInputData } from '@/types'

import { schema } from './schema'

const save = async (
  data: TInputData<DeviceCredentials>
): Promise<DeviceCredentials> => {
  const parsedData = schema.parse(data)
  const result = await prisma.deviceCredentials.upsert({
    create: parsedData,
    update: parsedData,
    where: {
      userId: parsedData.userId
    }
  })
  return result
}

const findUniqueByUserId = async (userId: string) => {
  return await prisma.deviceCredentials.findUnique({
    where: { userId }
  })
}

export const deviceCredentialsModel = {
  save,
  findUniqueByUserId
}
