import type { TUsersFilterValues } from '@/app/components/blocks/users-filter'
import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { requireCompany } from '@/entry/session'
import type {
  ShiftAssignment,
  TShiftPatternWithVersions,
  User
} from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { userModel } from '@/models/user/model'
import { filterUsers, getPositions } from '@/models/user/utils'

type TUsersPageData = {
  users: User[]
  total: number
  positions: string[]
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
}): Promise<TUsersPageData> => {
  const {
    company: { id: companyId },
    canEdit
  } = await requireCompany()
  const [allUsers, shiftPatterns] = await Promise.all([
    userModel.findManyByCompanyId(companyId),
    shiftPatternModel.findManyByCompanyId(companyId)
  ])
  const assignments = await shiftAssignmentModel.findManyByUserIds(
    allUsers.map(({ id }) => id)
  )
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  return {
    users: filterUsers(allUsers, {
      name,
      position: position ?? undefined,
      status
    }),
    total: allUsers.length,
    positions: getPositions(allUsers),
    filters: {
      name,
      position,
      status: status ? STATUS_PARAMS[status] : null
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
