import { requireCompany } from '@/entry/session'
import type { TShiftPatternWithVersions } from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { shiftPatternModel } from '@/models/shift-pattern/model'

export const getShiftPatternsPageData = async (): Promise<{
  shiftPatterns: TShiftPatternWithVersions[]
  today: string
  canEdit: boolean
}> => {
  const { company, canEdit } = await requireCompany()
  return {
    shiftPatterns: await shiftPatternModel.findManyByCompanyId(company.id),
    today: wallClockNow().format('YYYY-MM-DD'),
    canEdit
  }
}
