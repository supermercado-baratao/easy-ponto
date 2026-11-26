import { requireEditor } from '@/entry/session'
import type {
  JourneyRules,
  OvertimeBand,
  TCompanyWithDeviceCredentials
} from '@/infra/database/types'
import { journeyRulesModel } from '@/models/journey-rules/model'

type TSettingsPageData = {
  company: TCompanyWithDeviceCredentials
  journeyRules: JourneyRules
  overtimeBands: OvertimeBand[]
}

export const getSettingsPageData = async (): Promise<TSettingsPageData> => {
  const { company } = await requireEditor()
  const { journeyRules, overtimeBands } =
    await journeyRulesModel.findByCompanyId(company.id)
  return { company, journeyRules, overtimeBands }
}
