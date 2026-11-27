import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { requireCompany } from '@/entry/session'
import type { JobFunction, UserGroup } from '@/infra/database/types'
import { dayjs, wallClockNow } from '@/infra/dayjs'
import { timeSchema, timeToMinutes } from '@/infra/time'
import type { TScheduleAlertLimits } from '@/models/journey/types'
import { journeyRulesModel } from '@/models/journey-rules/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { userModel } from '@/models/user/model'
import {
  filterUsers,
  filterUsersByOrganization,
  getPositions,
  resolveOrganizationFilters
} from '@/models/user/utils'

import type { TAgendaFilters, TAgendaRow } from './_components/types'
import { buildAgendaRow, hasEntryOrExitAt } from './_components/utils'

const DATE_FORMAT = 'YYYY-MM-DD'

const AGENDA_DAYS = 7

type TAgendaPageData = {
  rows: TAgendaRow[]
  dates: string[]
  total: number
  positions: string[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  filters: TAgendaFilters
  limits: TScheduleAlertLimits
  canEdit: boolean
}

export const getAgendaPageData = async (searchParameters: {
  name?: string
  position?: string
  status?: string
  group?: string
  jobFunction?: string
  time?: string
}): Promise<TAgendaPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const today = dayjs(wallClockNow().format(DATE_FORMAT))
  const dates = Array.from({ length: AGENDA_DAYS }, (_, index) =>
    today.add(index, 'day').format(DATE_FORMAT)
  )
  const [
    { users: allUsers, groups, jobFunctions },
    companyDays,
    { journeyRules: limits }
  ] = await Promise.all([
    userModel.findManyWithOrganization(companyId),
    shiftAssignmentModel.findCompanyDays({
      companyId,
      initialDate: dates[0],
      finalDate: dates.at(-1)!
    }),
    journeyRulesModel.findByCompanyId(companyId)
  ])
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  const time = timeSchema.safeParse(searchParameters.time?.trim()).data || null
  const organization = { groups, jobFunctions }
  const organizationFilters = resolveOrganizationFilters(
    organization,
    searchParameters
  )
  const users = filterUsersByOrganization(
    filterUsers(allUsers, {
      name,
      position: position ?? undefined,
      status
    }),
    organizationFilters,
    organization
  )
  const rows = users
    .map((user) =>
      buildAgendaRow({
        user,
        shiftDays: companyDays.find(({ userId }) => userId === user.id),
        limits
      })
    )
    .filter(({ days }) => !time || hasEntryOrExitAt(days, timeToMinutes(time)))
  return {
    rows,
    dates,
    total: allUsers.length,
    positions: getPositions(allUsers),
    groups,
    jobFunctions,
    filters: {
      name,
      position,
      status: status ? STATUS_PARAMS[status] : null,
      group: organizationFilters.group,
      jobFunction: organizationFilters.jobFunction,
      time
    },
    limits,
    canEdit
  }
}
