import { getAdminUser } from '@/entry/admin-user'
import type {
  JustificationType,
  TAdminUserWithRelations,
  TJustificationWithType,
  TScheduleWithDays,
  User
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { holidayModel } from '@/models/holiday/model'
import { journeyModel } from '@/models/journey/model'
import type { TJourneyDay } from '@/models/journey/types'
import { justificationModel } from '@/models/justification/model'
import { justificationTypeModel } from '@/models/justification-type/model'
import { punchRecordModel } from '@/models/punch-record/model'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'
import { scheduleModel } from '@/models/schedule/model'
import { userModel } from '@/models/user/model'

type TPunchRecordsPageData = {
  adminUser: TAdminUserWithRelations
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TJourneyDay[]
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
  const punchRecordDays = user
    ? await punchRecordModel.findManyByDay({ pis: user.pis, ...period })
    : []
  const schedules = user
    ? await scheduleModel.findManyInPeriod({ userId: user.id, ...period })
    : []
  const justifications = user
    ? await justificationModel.findManyInPeriod({ userId: user.id, ...period })
    : []
  const holidays = adminUser.companyId
    ? await holidayModel.findManyByCompanyId(adminUser.companyId)
    : []
  const days = journeyModel.calculateDays({
    days: punchRecordDays,
    schedules,
    holidays,
    justifications
  })
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
    schedule: schedules[0] ?? null,
    defaultScheduleStartDate,
    justifications,
    justificationTypes
  }
}
