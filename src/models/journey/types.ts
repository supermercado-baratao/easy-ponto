import type {
  Holiday,
  JourneyRules,
  OvertimeBand,
  PunchRecord,
  TJustificationWithType
} from '@/infra/database/types'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'
import type { TResolvedDay, TShiftPair } from '@/models/shift-assignment/utils'

export type TJourneyPair = {
  entry: number
  exit: number | null
}

export type TOvertime = { percentage: number; minutes: number }[]

export type TScheduleAlert =
  'long-lunch' | 'long-journey' | 'long-continuous-work'

export type TScheduleDaySummary = {
  pairs: TShiftPair[]
  lunch: number
  journey: number
  alerts: TScheduleAlert[]
}

export type TScheduleAlertLimits = Pick<
  JourneyRules,
  'maxLunch' | 'maxDailyJourney' | 'maxContinuousWork'
>

export type TJourneyCalculationRules = {
  journeyRules: Pick<JourneyRules, 'punchTolerance' | 'dailyTolerance'>
  overtimeBands: Pick<OvertimeBand, 'dayKind' | 'upTo' | 'percentage'>[]
}

export type TJourneyDayKind =
  'workday' | 'day-off' | 'holiday' | 'excused' | 'no-schedule' | 'future'

export type TJourney = {
  kind: TJourneyDayKind
  holidayName: string | null
  pairs: TJourneyPair[]
  hasOddPunches: boolean
  expected: number
  worked: number
  absence: number
  lateness: number
  compensation: number
  overtime: TOvertime
}

export type TJourneyTotals = Pick<
  TJourney,
  'expected' | 'worked' | 'absence' | 'lateness' | 'compensation' | 'overtime'
>

export type TJourneyDayInput = {
  date: string
  punchRecords: PunchRecord[]
  shiftDay: TResolvedDay | null
  holiday: Holiday | null
  justifications: TJustificationWithType[]
  rules: TJourneyCalculationRules
  today: string
}

export type TJourneyDay = TPunchRecordDay & { journey: TJourney }

export type TJourneyCalculateDaysParams = {
  days: TPunchRecordDay[]
  shiftDays: TResolvedDay[]
  holidays: Holiday[]
  justifications: TJustificationWithType[]
  rules: TJourneyCalculationRules
  today?: string
}

export type TJourneyFindUserDaysParams = TPunchRecordPeriod & {
  companyId: string
  user: { id: string; pis: string }
}

export type TJourneyUserDays = {
  days: TJourneyDay[]
  justifications: TJustificationWithType[]
  overtimePercentages: number[]
}
