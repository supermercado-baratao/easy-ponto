import type {
  Holiday,
  PunchRecord,
  TJustificationWithType,
  TScheduleWithDays
} from '@/infra/database/types'
import type { TPunchRecordDay } from '@/models/punch-record/types'

export type TJourneyPair = {
  entry: number
  exit: number | null
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
  dayOff: number
  overtime60: number
  overtime100: number
}

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
