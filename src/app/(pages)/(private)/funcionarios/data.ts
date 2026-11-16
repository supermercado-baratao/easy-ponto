import { getAdminUser } from '@/entry/admin-user'
import type { User } from '@/infra/database/types'
import { userModel } from '@/models/user/model'
import {
  filterUsers,
  getPositions,
  type TUserFilters
} from '@/models/user/utils'

import { STATUS_PARAMS } from './_components/utils'

type TUsersPageData = {
  hasCompany: boolean
  users: User[]
  total: number
  positions: string[]
  filters: { name: string; position: string | null; status: string | null }
}

const parseStatus = (status?: string): TUserFilters['status'] => {
  const entry = Object.entries(STATUS_PARAMS).find(
    ([, parameter]) => parameter === status
  )
  return entry?.[0] as TUserFilters['status']
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
  const status = parseStatus(searchParameters.status)
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
