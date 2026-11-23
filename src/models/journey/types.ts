import type {
  Holiday,
  PunchRecord,
  TJustificationWithType,
  TScheduleWithDays
} from '@/infra/database/types'
import type {
  TPunchRecordDay,
  TPunchRecordPeriod
} from '@/models/punch-record/types'

export type TJourneyPair = {
  entry: number
  exit: number | null
}

export type TScheduleAlert =
  'long-lunch' | 'long-journey' | 'long-continuous-work'

export type TScheduleDaySummary = {
  pairs: { entry: number; exit: number }[]
  lunch: number
  journey: number
  alerts: TScheduleAlert[]
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
  overtime60: number
  overtime100: number
}

export type TJourneyTotals = Pick<
  TJourney,
  | 'expected'
  | 'worked'
  | 'absence'
  | 'lateness'
  | 'compensation'
  | 'overtime60'
  | 'overtime100'
>

export type TJourneyDayInput = {
  date: string
  punchRecords: PunchRecord[]
  schedule: TScheduleWithDays | null
  holiday: Holiday | null
  justifications: TJustificationWithType[]
  today: string
}

export type TJourneyDay = TPunchRecordDay & { journey: TJourney }

export type TJourneyCalculateDaysParams = {
  days: TPunchRecordDay[]
  schedules: TScheduleWithDays[]
  holidays: Holiday[]
  justifications: TJustificationWithType[]
  today?: string
}

export type TJourneyFindUserDaysParams = TPunchRecordPeriod & {
  companyId: string
  user: { id: string; pis: string }
}

export type TJourneyUserDays = {
  days: TJourneyDay[]
  schedules: TScheduleWithDays[]
  justifications: TJustificationWithType[]
}
