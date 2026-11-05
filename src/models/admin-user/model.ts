import type {
  AdminUser,
  TAdminUserWithRelations,
  TInputData
} from '@/infra/database/types'
import { adminUserRepository } from '@/repositories/admin-user-repository'

const findUniqueById = async (id: string): Promise<TAdminUserWithRelations> =>
  await adminUserRepository.findUniqueById(id)

const create = async (): Promise<AdminUser> =>
  await adminUserRepository.create()

const update = async ({
  id,
  ...data
}: Partial<TInputData<AdminUser>> & { id: string }): Promise<AdminUser> => {
  const result = await adminUserRepository.update(id, data)
  if (!result) throw new Error(`AdminUser ${id} not found`)
  return result
}

export const adminUserModel = {
  findUniqueById,
  create,
  update
}
