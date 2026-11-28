import { requireCompany } from '@/entry/session'
import { wallClockNow } from '@/infra/dayjs'
import { restRuleModel } from '@/models/rest-rule/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'

import type { TRestRulesPageData } from './_components/types'

export const getRestRulesPageData = async (): Promise<TRestRulesPageData> => {
  const { company, canEdit } = await requireCompany()
  const [rules, shiftPatterns] = await Promise.all([
    restRuleModel.findManyByCompanyId(company.id),
    shiftPatternModel.findManyByCompanyId(company.id)
  ])
  return {
    rules,
    shiftPatterns: shiftPatterns.map(({ id, name }) => ({ id, name })),
    // The rests of a month are planned ahead, so the next month is the usual choice
    nextMonth: wallClockNow().add(1, 'month').format('YYYY-MM'),
    canEdit
  }
}
