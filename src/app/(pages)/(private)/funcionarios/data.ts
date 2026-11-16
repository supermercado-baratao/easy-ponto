import type { TUsersFilterValues } from '@/app/components/blocks/users-filter'
import { getStatusFromParameter, STATUS_PARAMS } from '@/app/utils/user-status'
import { getAdminUser } from '@/entry/admin-user'
import type { User } from '@/infra/database/types'
import { userModel } from '@/models/user/model'
import { filterUsers, getPositions } from '@/models/user/utils'

type TUsersPageData = {
  hasCompany: boolean
  users: User[]
  total: number
  positions: string[]
  filters: TUsersFilterValues
}

export const getUsersPageData = async (searchParameters: {
  name?: string
  position?: string
  status?: string
}): Promise<TUsersPageData> => {
  const { companyId } = await getAdminUser()
  const allUsers = companyId
    ? await userModel.findManyByCompanyId(companyId)
    : []
  const name = searchParameters.name?.trim() ?? ''
  const position = searchParameters.position?.trim() || null
  const status = getStatusFromParameter(searchParameters.status)
  return {
    hasCompany: !!companyId,
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
    }
  }
}
