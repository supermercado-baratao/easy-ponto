import { requireCompany } from '@/entry/session'
import type { UserGroup } from '@/infra/database/types'
import { userGroupModel } from '@/models/user-group/model'
import { sortGroupsByPath } from '@/models/user-group/utils'

import type { TUserGroupRow } from './_components/types'

export const getUserGroupsPageData = async (): Promise<{
  groups: UserGroup[]
  rows: TUserGroupRow[]
  canEdit: boolean
}> => {
  const { company, canEdit } = await requireCompany()
  const [groups, members] = await Promise.all([
    userGroupModel.findManyByCompanyId(company.id),
    userGroupModel.findMembersByCompanyId(company.id)
  ])
  return {
    groups,
    rows: sortGroupsByPath(groups).map((group) => ({
      group,
      members: members.filter(({ groupId }) => groupId === group.id).length
    })),
    canEdit
  }
}
