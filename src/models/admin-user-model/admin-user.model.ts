import { prisma } from '@/infra/database/client'
import type { AdminUser } from '@/infra/database/generated/client'
import { TInputData } from '@/types'

import { TAdminUserWithRelations } from './types'

const findUniqueById = async (id: string): Promise<TAdminUserWithRelations> => {
  const result = await prisma.adminUser.findUniqueOrThrow({
    where: { id },
    include: {
      company: true,
      deviceCredentials: true,
      user: true
    }
  })
  return result
}

const create = async (): Promise<AdminUser> => {
  const result = await prisma.adminUser.create({
    data: {}
  })
  return result
}

const update = async (
  data: Partial<TInputData<AdminUser>> & { id: string }
): Promise<AdminUser> => {
  const result = await prisma.adminUser.update({
    where: { id: data.id },
    data
  })
  return result
}

export const adminUserModel = {
  findUniqueById,
  create,
  update
}
