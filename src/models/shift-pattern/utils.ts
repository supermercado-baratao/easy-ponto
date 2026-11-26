import type {
  ShiftPatternVersionDay,
  TShiftPatternVersionWithDays
} from '@/infra/database/types'
import {
  minutesToTime,
  TIME_FIELDS,
  timeToMinutes,
  type TScheduleTimeField
} from '@/models/schedule/utils'

export const MIN_CYCLE_LENGTH = 1

// Five weeks fit the rotations of a month, so a longer cycle is more likely a typo
export const MAX_CYCLE_LENGTH = 35

export const MINUTES_PER_DAY = 24 * 60

export const CYCLE_DAYS = Array.from(
  { length: MAX_CYCLE_LENGTH },
  (_, index) => index + 1
)

export type TCycleDayTimes = Pick<ShiftPatternVersionDay, TScheduleTimeField>

export type TCycleDay = TCycleDayTimes &
  Pick<ShiftPatternVersionDay, 'cycleDay'>

export type TShiftPatternTimeFieldName =
  `day${number}${Capitalize<TScheduleTimeField>}`

export const getDayTimeFieldName = (
  cycleDay: number,
  field: TScheduleTimeField
): TShiftPatternTimeFieldName =>
  `day${cycleDay}${field.charAt(0).toUpperCase()}${field.slice(1)}` as TShiftPatternTimeFieldName

export const formatCycleTime = (minutes: number | null): string =>
  minutes === null ? '' : minutesToTime(minutes % MINUTES_PER_DAY)

export const isPastMidnight = (minutes: number | null): boolean =>
  minutes !== null && minutes >= MINUTES_PER_DAY

export const isDayOff = (day: TCycleDayTimes): boolean => day.entry1 === null

export const getDayTimes = (day: TCycleDayTimes): number[] =>
  TIME_FIELDS.map((field) => day[field]).filter((time) => time !== null)

export const isSameShiftPatternName = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()

export const selectVersionInEffect = (
  versionsByStartDateDesc: TShiftPatternVersionWithDays[],
  date: string
): TShiftPatternVersionWithDays | null =>
  versionsByStartDateDesc.find(({ startDate }) => startDate <= date) ??
  versionsByStartDateDesc.at(-1) ??
  null

const OFF_DAY: TCycleDayTimes = {
  entry1: null,
  exit1: null,
  entry2: null,
  exit2: null,
  entry3: null,
  exit3: null
}

const toDayTimes = (...times: string[]): TCycleDayTimes => ({
  ...OFF_DAY,
  ...Object.fromEntries(
    times.map((time, index) => [TIME_FIELDS[index], timeToMinutes(time)])
  )
})

export const SHIFT_PATTERN_TEMPLATES = [
  {
    key: '6x1',
    label: '6x1 (44 horas semanais)',
    days: [
      ...Array.from({ length: 6 }, () =>
        toDayTimes('08:00', '12:00', '13:00', '16:20')
      ),
      OFF_DAY
    ]
  },
  {
    key: '5x2',
    label: '5x2 (44 horas semanais)',
    days: [
      ...Array.from({ length: 5 }, () =>
        toDayTimes('08:00', '12:00', '13:00', '17:48')
      ),
      OFF_DAY,
      OFF_DAY
    ]
  },
  {
    key: '12x36',
    label: '12x36',
    days: [toDayTimes('07:00', '19:00'), OFF_DAY]
  }
] as const satisfies { key: string; label: string; days: TCycleDayTimes[] }[]

export type TShiftPatternTemplateKey =
  (typeof SHIFT_PATTERN_TEMPLATES)[number]['key']
