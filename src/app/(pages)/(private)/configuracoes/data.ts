import { getAdminUser } from '@/entry/admin-user'
import type { TAdminUserWithRelations } from '@/infra/database/types'

export const getSettingsPageData = async (): Promise<TAdminUserWithRelations> =>
  await getAdminUser()
