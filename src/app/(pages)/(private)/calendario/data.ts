import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { requireCompany } from '@/entry/session'
import type { JobFunction, UserGroup } from '@/infra/database/types'
import { userModel } from '@/models/user/model'
import {
  filterUsers,
  filterUsersByOrganization,
  getPositions,
  resolveOrganizationFilters
} from '@/models/user/utils'
import { workloadCalendarModel } from '@/models/workload-calendar/model'

import type {
  TCalendarFilters,
  TCalendarRow,
  TCalendarUserMonthView
} from './_components/types'

type TCalendarPageData = {
  month: string
  rows: TCalendarRow[]
  selected: TCalendarUserMonthView | null
  total: number
  positions: string[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  filters: TCalendarFilters
  canEdit: boolean
}

export const getCalendarPageData = async (searchParameters: {
  month?: string
  userId?: string
  name?: string
  position?: string
  status?: string
  group?: string
  jobFunction?: string
}): Promise<TCalendarPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const month = workloadCalendarModel.resolveMonth(searchParameters.month)
  const [{ users, summaries, selected }, usersWithOrganization] =
    await Promise.all([
      workloadCalendarModel.findMonth({
        companyId,
        month,
        userId: searchParameters.userId
      }),
      userModel.findManyWithOrganization(companyId)
    ])
  const { groups, jobFunctions } = usersWithOrganization
  const organization = { groups, jobFunctions }
  const organizationFilters = resolveOrganizationFilters(
    organization,
    searchParameters
  )
  const organizationUserIds = new Set(
    filterUsersByOrganization(
      usersWithOrganization.users,
      organizationFilters,
      organization
    ).map(({ id }) => id)
  )
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  const rows = filterUsers(users, {
    name,
    position: position ?? undefined,
    status
  })
    .filter(({ id }) => organizationUserIds.has(id))
    .map((user) => ({
      user,
      summary: summaries.find(({ userId }) => userId === user.id)!
    }))
  return {
    month,
    rows,
    selected: selected && {
      user: selected.user,
      weeks: selected.weeks,
      summary: selected.summary,
      assignments: selected.assignments.map(
        ({ id, startDate, endDate, shiftPattern }) => ({
          id,
          startDate,
          endDate,
          name: shiftPattern.name
        })
      )
    },
    total: users.length,
    positions: getPositions(users),
    groups,
    jobFunctions,
    filters: {
      name,
      position,
      status: status ? STATUS_PARAMS[status] : null,
      group: organizationFilters.group,
      jobFunction: organizationFilters.jobFunction,
      userId: selected?.user.id ?? null
    },
    canEdit
  }
}
