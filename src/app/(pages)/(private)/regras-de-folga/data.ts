import { requireCompany } from '@/entry/session'
import { wallClockNow } from '@/infra/dayjs'
import { restRestrictionModel } from '@/models/rest-restriction/model'
import { restRuleModel } from '@/models/rest-rule/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { userModel } from '@/models/user/model'
import { INACTIVE_USER_STATUSES, type TUserStatus } from '@/models/user/utils'
import { userGroupModel } from '@/models/user-group/model'
import { getGroupLabel, sortGroupsByPath } from '@/models/user-group/utils'

import type { TRestRulesPageData } from './_components/types'

export const getRestRulesPageData = async (): Promise<TRestRulesPageData> => {
  const { company, canEdit } = await requireCompany()
  const [rules, shiftPatterns, restrictions, users, groups] = await Promise.all(
    [
      restRuleModel.findManyByCompanyId(company.id),
      shiftPatternModel.findManyByCompanyId(company.id),
      restRestrictionModel.findManyByCompanyId(company.id),
      userModel.findManyByCompanyId(company.id),
      userGroupModel.findManyByCompanyId(company.id)
    ]
  )
  return {
    rules,
    shiftPatterns: shiftPatterns.map(({ id, name }) => ({ id, name })),
    restrictions,
    users: users
      .filter(
        ({ status }) => !INACTIVE_USER_STATUSES.includes(status as TUserStatus)
      )
      .map(({ id, name }) => ({ id, name })),
    groups: sortGroupsByPath(groups).map(({ id }) => ({
      id,
      label: getGroupLabel(groups, id)
    })),
    // The rests of a month are planned ahead, so the next month is the usual choice
    nextMonth: wallClockNow().add(1, 'month').format('YYYY-MM'),
    canEdit
  }
}
