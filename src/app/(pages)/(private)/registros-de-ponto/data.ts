import type {
  TAdminUserWithRelations,
  TUserWithPunchRecords,
  User
} from '@/infra/database/types'
import { adminUserModel } from '@/models/admin-user/model'
import { userModel } from '@/models/user/model'

type TPunchRecordsPageData = {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: TUserWithPunchRecords | null
}

export const getPunchRecordsPageData =
  async (): Promise<TPunchRecordsPageData> => {
    const adminUser = await adminUserModel.findUniqueById(
      process.env.ADMIN_USER_ID!
    )
    const users = await userModel.findManyByCompanyId(
      adminUser?.companyId ?? ''
    )
    const user = users[1]
      ? await userModel.findUniqueByPisWithPunchRecords(users[1].pis)
      : null
    return { adminUser, users, user }
  }
