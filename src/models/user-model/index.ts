import { User } from '@prisma/client'

import { prisma } from '@/infra/prisma'
import { TInputData } from '@/types'

const createMany = async (data: TInputData<User>[]): Promise<void> => {
  await prisma.user.createMany({
    data
  })
}

const findManyByCompanyId = async (companyId: string): Promise<User[]> => {
  const result = await prisma.user.findMany({
    where: { companyId }
  })
  return result
}

const updateMany = async (
  data: (TInputData<User> & { id: string })[]
): Promise<void> => {
  await prisma.user.updateMany({
    where: { id: { in: data.map((user) => user.id) } },
    data
  })
}

export const userModel = {
  createMany,
  findManyByCompanyId,
  updateMany
}
