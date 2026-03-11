import { User } from '@prisma/client'

import { prisma } from '@/infra/prisma'

const findUniqueById = async (id: string): Promise<User> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id }
  })

  return user
}

const create = async (): Promise<User> => {
  const result = await prisma.user.create({
    data: {}
  })
  return result
}

export const userModel = {
  findUniqueById,
  create
}
