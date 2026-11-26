import type { JourneyRules, OvertimeBand } from '@/infra/database/types'

export type TOvertimeBandField = 'upTo' | 'percentage'

export type TJourneyRulesFormData = {
  companyId: string
  punchTolerance: string
  dailyTolerance: string
  maxLunch: string
  maxDailyJourney: string
  maxContinuousWork: string
}

export type TOvertimeBandsFormData = { companyId: string } & Record<
  string,
  string
>

export type TCompanyJourneyRules = {
  journeyRules: JourneyRules
  overtimeBands: OvertimeBand[]
}
