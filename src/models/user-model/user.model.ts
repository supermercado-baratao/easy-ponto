import { prisma } from '@/infra/database/client'
import type { User } from '@/infra/database/generated/client'
import { TInputData } from '@/types'

import { TUserWithPunchRecords } from './types'

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

const findManyByNames = async (names: string[]): Promise<User[]> => {
  const result = await prisma.user.findMany({
    where: {
      name: {
        in: names
      }
    }
  })
  return result
}

const findUniqueByPisWithPunchRecords = async (
  pis: string
): Promise<TUserWithPunchRecords> => {
  const result = await prisma.user.findUniqueOrThrow({
    where: { pis },
    include: {
      punchRecords: true
    }
  })
  return result
}

const updateMany = async (
  data: (TInputData<User> & { id: string })[]
): Promise<void> => {
  await prisma.$transaction(
    data.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: user
      })
    )
  )
}

export const userModel = {
  createMany,
  findManyByCompanyId,
  findManyByNames,
  findUniqueByPisWithPunchRecords,
  updateMany
}
