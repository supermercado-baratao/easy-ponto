import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { adminUsers } from '@/infra/database/schema'
import type {
  AdminUser,
  TAdminUserWithRelations,
  TInputData
} from '@/infra/database/types'

export const adminUserRepository = {
  findUniqueById: async (id: string): Promise<TAdminUserWithRelations> => {
    const adminUser = await database.query.adminUsers.findFirst({
      where: { id },
      with: { company: true, deviceCredentials: true, user: true }
    })
    if (!adminUser) throw new Error(`AdminUser ${id} not found`)
    return adminUser
  },

  create: async (): Promise<AdminUser> => {
    const [adminUser] = await database.insert(adminUsers).values({}).returning()
    return adminUser
  },

  update: async (
    id: string,
    data: Partial<TInputData<AdminUser>>
  ): Promise<AdminUser | null> => {
    const [adminUser = null] = await database
      .update(adminUsers)
      .set(data)
      .where(eq(adminUsers.id, id))
      .returning()
    return adminUser
  }
}
