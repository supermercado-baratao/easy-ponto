import type { JourneyRules, OvertimeBand } from '@/infra/database/types'
import { journeyRulesRepository } from '@/repositories/journey-rules-repository'

import {
  companyIdSchema,
  journeyRulesSchema,
  overtimeBandsSchema
} from './schema'
import type {
  TCompanyJourneyRules,
  TJourneyRulesFormData,
  TOvertimeBandsFormData
} from './types'

const findByCompanyId = async (
  companyId: string
): Promise<TCompanyJourneyRules> => {
  const id = companyIdSchema.parse(companyId)
  const [journeyRules, overtimeBands] = await Promise.all([
    journeyRulesRepository.findByCompanyId(id),
    journeyRulesRepository.findOvertimeBandsByCompanyId(id)
  ])
  if (!journeyRules) throw new Error(`Journey rules of company ${id} not found`)
  return { journeyRules, overtimeBands }
}

const findOvertimeBands = async (companyId: string): Promise<OvertimeBand[]> =>
  await journeyRulesRepository.findOvertimeBandsByCompanyId(
    companyIdSchema.parse(companyId)
  )

const saveRules = async (data: TJourneyRulesFormData): Promise<JourneyRules> =>
  await journeyRulesRepository.save(journeyRulesSchema.parse(data))

const saveOvertimeBands = async (
  data: TOvertimeBandsFormData
): Promise<OvertimeBand[]> =>
  await journeyRulesRepository.replaceOvertimeBands(
    overtimeBandsSchema.parse(data)
  )

export const journeyRulesModel = {
  findByCompanyId,
  findOvertimeBands,
  saveRules,
  saveOvertimeBands
}
