import type { TAdminUserWithRelations } from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'

export const getAdminUser = async (): Promise<TAdminUserWithRelations> =>
  await adminUserModel.findUniqueById(process.env.ADMIN_USER_ID!)
