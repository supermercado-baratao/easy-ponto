import type { TUsersFilterValues } from '@/app/components/blocks/users-filter'
import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { requireCompany } from '@/entry/session'
import type {
  JobFunction,
  ShiftAssignment,
  TShiftPatternWithVersions,
  UserGroup
} from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { userModel } from '@/models/user/model'
import type { TUserWithOrganization } from '@/models/user/types'
import {
  filterUsers,
  filterUsersByOrganization,
  getPositions,
  resolveOrganizationFilters
} from '@/models/user/utils'

type TUsersPageData = {
  users: TUserWithOrganization[]
  total: number
  positions: string[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  filters: TUsersFilterValues
  shiftPatterns: TShiftPatternWithVersions[]
  assignments: ShiftAssignment[]
  today: string
  canEdit: boolean
}

export const getUsersPageData = async (searchParameters: {
  name?: string
  position?: string
  status?: string
  group?: string
  jobFunction?: string
}): Promise<TUsersPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const [{ users: allUsers, groups, jobFunctions }, shiftPatterns] =
    await Promise.all([
      userModel.findManyWithOrganization(companyId),
      shiftPatternModel.findManyByCompanyId(companyId)
    ])
  const assignments = await shiftAssignmentModel.findManyByUserIds(
    allUsers.map(({ id }) => id)
  )
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  const organization = { groups, jobFunctions }
  const organizationFilters = resolveOrganizationFilters(
    organization,
    searchParameters
  )
  return {
    users: filterUsersByOrganization(
      filterUsers(allUsers, {
        name,
        position: position ?? undefined,
        status
      }),
      organizationFilters,
      organization
    ),
    total: allUsers.length,
    positions: getPositions(allUsers),
    groups,
    jobFunctions,
    filters: {
      name,
      position,
      status: status ? STATUS_PARAMS[status] : null,
      group: organizationFilters.group,
      jobFunction: organizationFilters.jobFunction
    },
    shiftPatterns,
    // The page reads the patterns once, so each link leaves its copy out
    assignments: assignments.map(
      ({
        id,
        userId,
        shiftPatternId,
        startDate,
        endDate,
        cycleStartDay,
        createdAt,
        updatedAt
      }) => ({
        id,
        userId,
        shiftPatternId,
        startDate,
        endDate,
        cycleStartDay,
        createdAt,
        updatedAt
      })
    ),
    today: wallClockNow().format('YYYY-MM-DD'),
    canEdit
  }
}
