import { getAdminUser } from '@/entry/admin-user'
import type { TAdminUserWithRelations, User } from '@/infra/database/types'
import { punchRecordModel } from '@/models/punch-record/model'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'
import { userModel } from '@/models/user/model'

type TPunchRecordsPageData = {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TPunchRecordDay[]
}

export const getPunchRecordsPageData = async ({
  pis,
  initialDate,
  finalDate
}: {
  pis?: string
  initialDate?: string
  finalDate?: string
}): Promise<TPunchRecordsPageData> => {
  const adminUser = await getAdminUser()
  const users = adminUser.companyId
    ? await userModel.findManyByCompanyId(adminUser.companyId)
    : []
  const user = users.find((user) => user.pis === pis) ?? users[0] ?? null
  const period = punchRecordModel.resolvePeriod({ initialDate, finalDate })
  const days = user
    ? await punchRecordModel.findManyByDay({ pis: user.pis, ...period })
    : []
  return { adminUser, users, user, period, days }
}
