import { User } from '@prisma/client'

import { prisma } from '@/infra/prisma'
import { TInputData } from '@/types'

import { TUserWithPunchRecords } from './types'

const createMany = async (data: TInputData<User>[]): Promise<void> => {
  await prisma.user.createMany({
    data
  })
}

const findManyByCompanyId = async (companyId: string): Promise<User[]> => {
  const result = await prisma.user.findMany({
    where: { companyId },
    orderBy: {
      name: 'asc'
    }
  })
  return result
}

const findManyByNames = async (names: string[]): Promise<User[]> => {
  const result = await prisma.user.findMany({
    where: {
      name: {
        in: names
      }
    },
    orderBy: {
      name: 'asc'
    }
  })
  return result
}

const findUniqueByPisWithPunchRecords = async (
  pis: string
): Promise<TUserWithPunchRecords | null> => {
  const result = await prisma.user.findUnique({
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
