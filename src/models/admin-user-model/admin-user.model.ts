import { db } from '@/infra/database/client'
import type { AdminUser } from '@/infra/database/types'
import { TInputData } from '@/types'

import { TAdminUserWithRelations } from './types'

const adminUsers = db.orm.public.AdminUser

const findUniqueById = async (id: string): Promise<TAdminUserWithRelations> => {
  const result = await adminUsers
    .whereUnique({ id })
    .include('company')
    .include('deviceCredentials')
    .include('user')
    .firstOrThrow()
  return result
}

const create = async (): Promise<AdminUser> => {
  const result = await adminUsers.create({})
  return result
}

const update = async ({
  id,
  ...data
}: Partial<TInputData<AdminUser>> & { id: string }): Promise<AdminUser> => {
  const result = await adminUsers.where({ id }).update(data)
  if (!result) throw new Error(`AdminUser ${id} not found`)
  return result
}

export const adminUserModel = {
  findUniqueById,
  create,
  update
}
