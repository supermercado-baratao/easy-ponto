import type {
  AdminUser,
  TAdminUserWithRelations,
  TInputData
} from '@/infra/database/types'
import { adminUserRepo } from '@/repositories/admin-user-repo'

const findUniqueById = async (id: string): Promise<TAdminUserWithRelations> =>
  await adminUserRepo.findUniqueById(id)

const create = async (): Promise<AdminUser> => await adminUserRepo.create()

const update = async ({
  id,
  ...data
}: Partial<TInputData<AdminUser>> & { id: string }): Promise<AdminUser> => {
  const result = await adminUserRepo.update(id, data)
  if (!result) throw new Error(`AdminUser ${id} not found`)
  return result
}

export const adminUserModel = {
  findUniqueById,
  create,
  update
}
