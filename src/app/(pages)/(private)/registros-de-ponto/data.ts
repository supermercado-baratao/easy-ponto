import { getAdminUser } from '@/entry/admin-user'
import type {
  JustificationType,
  TAdminUserWithRelations,
  TJustificationWithType,
  TScheduleWithDays,
  User
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { justificationModel } from '@/models/justification/model'
import { justificationTypeModel } from '@/models/justification-type/model'
import { punchRecordModel } from '@/models/punch-record/model'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'
import { scheduleModel } from '@/models/schedule/model'
import { userModel } from '@/models/user/model'

type TPunchRecordsPageData = {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TPunchRecordDay[]
  schedule: TScheduleWithDays | null
  defaultScheduleStartDate: string
  justifications: TJustificationWithType[]
  justificationTypes: JustificationType[]
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
  const schedule = user
    ? await scheduleModel.findInEffect({
        userId: user.id,
        date: period.finalDate
      })
    : null
  const justifications = user
    ? await justificationModel.findManyInPeriod({ userId: user.id, ...period })
    : []
  const justificationTypes = adminUser.companyId
    ? await justificationTypeModel.findManyByCompanyId(adminUser.companyId)
    : []
  const defaultScheduleStartDate = user?.admissionDate
    ? dayjs(user.admissionDate).format('YYYY-MM-DD')
    : period.initialDate
  return {
    adminUser,
    users,
    user,
    period,
    days,
    schedule,
    defaultScheduleStartDate,
    justifications,
    justificationTypes
  }
}
