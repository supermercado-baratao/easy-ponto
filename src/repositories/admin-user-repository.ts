import { database } from '@/infra/database/client'
import type {
  AdminUser,
  TAdminUserWithRelations,
  TInputData
} from '@/infra/database/types'

const adminUsers = database.orm.public.AdminUser

export const adminUserRepository = {
  findUniqueById: async (id: string): Promise<TAdminUserWithRelations> =>
    await adminUsers
      .whereUnique({ id })
      .include('company')
      .include('deviceCredentials')
      .include('user')
      .firstOrThrow(),

  create: async (): Promise<AdminUser> => await adminUsers.create({}),

  update: async (
    id: string,
    data: Partial<TInputData<AdminUser>>
  ): Promise<AdminUser | null> => await adminUsers.where({ id }).update(data)
}
