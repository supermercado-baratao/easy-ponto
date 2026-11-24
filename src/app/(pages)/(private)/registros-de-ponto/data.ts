import { redirect } from 'next/navigation'

import { requireCompany } from '@/entry/session'
import type {
  JustificationType,
  TJustificationWithType,
  TScheduleWithDays,
  User
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { isCompanyConfigured } from '@/models/company/utils'
import { journeyModel } from '@/models/journey/model'
import type { TJourneyDay } from '@/models/journey/types'
import { justificationTypeModel } from '@/models/justification-type/model'
import { punchRecordModel } from '@/models/punch-record/model'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'
import { userModel } from '@/models/user/model'

type TPunchRecordsPageData = {
  hasDevice: boolean
  users: User[]
  user: User | null
  period: TPunchRecordPeriod
  days: TJourneyDay[]
  schedule: TScheduleWithDays | null
  defaultScheduleStartDate: string
  justifications: TJustificationWithType[]
  justificationTypes: JustificationType[]
  canEdit: boolean
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
  const { company, canEdit } = await requireCompany()
  // Every way into the app lands here, so it sends the editor of a new company to set it up (#94)
  if (canEdit && !isCompanyConfigured(company)) redirect('/configuracoes')
  const users = await userModel.findManyByCompanyId(company.id)
  const user = users.find((user) => user.pis === pis) ?? users[0] ?? null
  const period = punchRecordModel.resolvePeriod({ initialDate, finalDate })
  const { days, schedules, justifications } = user
    ? await journeyModel.findUserDays({
        companyId: company.id,
        user,
        ...period
      })
    : { days: [], schedules: [], justifications: [] }
  const justificationTypes = await justificationTypeModel.findManyByCompanyId(
    company.id
  )
  const defaultScheduleStartDate = user?.admissionDate
    ? dayjs(user.admissionDate).format('YYYY-MM-DD')
    : period.initialDate
  return {
    hasDevice: !!company.deviceCredentials,
    users,
    user,
    period,
    days,
    schedule: schedules[0] ?? null,
    defaultScheduleStartDate,
    justifications,
    justificationTypes,
    canEdit
  }
}
