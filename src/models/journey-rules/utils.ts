import type { JourneyRules, OvertimeBand } from '@/infra/database/types'

import type { TOvertimeBandField } from './types'

// CLT art. 58, § 1º (up to 5 minutes per punch and 10 a day are neither discounted nor paid as
// overtime), art. 71 (a break of at most 2 hours, required after 6 hours in a row) and art. 58 (8 hours
// a day). A collective agreement may change them, so each company edits its own until the CLT review (#65)
export const DEFAULT_JOURNEY_RULES = {
  punchTolerance: 5,
  dailyTolerance: 10,
  maxLunch: 120,
  maxDailyJourney: 480,
  maxContinuousWork: 360
} as const satisfies Omit<
  JourneyRules,
  'id' | 'companyId' | 'createdAt' | 'updatedAt'
>

export const MAX_TOLERANCE = 60

export const DAY_KINDS = ['workday', 'day-off', 'holiday'] as const

export type TDayKind = (typeof DAY_KINDS)[number]

export const DAY_KIND_LABELS: Record<TDayKind, string> = {
  workday: 'Dia útil',
  'day-off': 'Folga',
  holiday: 'Feriado'
}

export const MAX_OVERTIME_BANDS = 4

export const MAX_OVERTIME_PERCENTAGE = 999

export const OVERTIME_BAND_INDEXES = Array.from(
  { length: MAX_OVERTIME_BANDS },
  (_, index) => index + 1
)

export const getOvertimeBandFieldName = (
  dayKind: TDayKind,
  index: number,
  field: TOvertimeBandField
): string => `${dayKind}-${index}-${field}`

// A company starts without the overtime percentages (#105), since each one follows its own agreement
export const hasOvertimeBands = (
  overtimeBands: Pick<OvertimeBand, 'dayKind'>[]
): boolean =>
  DAY_KINDS.every((dayKind) =>
    overtimeBands.some((band) => band.dayKind === dayKind)
  )
