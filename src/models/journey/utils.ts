import type {
  PunchRecord,
  ScheduleDay,
  TJustificationWithType
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { TIME_PAIRS } from '@/models/schedule/utils'

import type { TJourney, TJourneyDayInput, TJourneyPair } from './types'

// CLT art. 58, § 1º: variations of up to 5 minutes per punch, limited to 10 minutes a day, are neither
// discounted nor paid as overtime. Provisional until the CLT review of the journey rules (#41)
export const PUNCH_TOLERANCE = 5
export const DAILY_TOLERANCE = 10

type TInterval = { start: number; end: number }

const toMinutes = (datetime: Date): number => {
  const time = dayjs(datetime)
  return time.hour() * 60 + time.minute()
}

export const buildPairs = (punchRecords: PunchRecord[]): TJourneyPair[] => {
  const times = punchRecords.map(({ datetime }) => toMinutes(datetime))
  return Array.from({ length: Math.ceil(times.length / 2) }, (_, index) => ({
    entry: times[index * 2],
    exit: times[index * 2 + 1] ?? null
  }))
}

const sumIntervals = (intervals: TInterval[]): number =>
  intervals.reduce((total, { start, end }) => total + end - start, 0)

const isInterval = (interval: {
  start: number | null
  end: number | null
}): interval is TInterval => interval.start !== null && interval.end !== null

const getWorkedIntervals = (pairs: TJourneyPair[]): TInterval[] =>
  pairs
    .map(({ entry, exit }) => ({ start: entry, end: exit }))
    .filter(isInterval)

const getScheduledIntervals = (scheduleDay?: ScheduleDay): TInterval[] =>
  TIME_PAIRS.map(({ entry, exit }) => ({
    start: scheduleDay?.[entry] ?? null,
    end: scheduleDay?.[exit] ?? null
  })).filter(isInterval)

const getOverlap = (first: TInterval, second: TInterval): number =>
  Math.max(
    0,
    Math.min(first.end, second.end) - Math.max(first.start, second.start)
  )

const getExcusedMinutes = (
  scheduled: TInterval[],
  justifications: TJustificationWithType[]
): number => {
  const excused = justifications
    .map(({ startTime, endTime }) => ({ start: startTime, end: endTime }))
    .filter(isInterval)
  let total = 0
  for (const interval of scheduled) {
    for (const excuse of excused) total += getOverlap(interval, excuse)
  }
  return total
}

const isWithinTolerance = (
  punchTimes: number[],
  scheduled: TInterval[]
): boolean => {
  const scheduledTimes = scheduled.flatMap(({ start, end }) => [start, end])
  if (punchTimes.length !== scheduledTimes.length) return false
  const variations = punchTimes.map((time, index) =>
    Math.abs(time - scheduledTimes[index])
  )
  return (
    variations.every((variation) => variation <= PUNCH_TOLERANCE) &&
    variations.reduce((total, variation) => total + variation, 0) <=
      DAILY_TOLERANCE
  )
}

export const calculateDay = ({
  date,
  punchRecords,
  schedule,
  holiday,
  justifications,
  today
}: TJourneyDayInput): TJourney => {
  const pairs = buildPairs(punchRecords)
  const worked = sumIntervals(getWorkedIntervals(pairs))
  const journey: TJourney = {
    kind: 'workday',
    holidayName: holiday?.name ?? null,
    pairs,
    hasOddPunches: punchRecords.length % 2 !== 0,
    expected: 0,
    worked,
    absence: 0,
    lateness: 0,
    overtime60: 0,
    overtime100: 0
  }

  if (date > today) return { ...journey, kind: 'future' }
  if (holiday) return { ...journey, kind: 'holiday', overtime100: worked }
  if (!schedule) return { ...journey, kind: 'no-schedule' }

  const weekday = dayjs(date).day()
  const scheduled = getScheduledIntervals(
    schedule.days.find((day) => day.weekday === weekday)
  )
  if (scheduled.length === 0) {
    return { ...journey, kind: 'day-off', overtime100: worked }
  }

  const excuses = justifications.filter(({ type }) => type.effect === 'excuse')
  if (excuses.some(({ startTime }) => startTime === null)) {
    return { ...journey, kind: 'excused', overtime60: worked }
  }

  const expected =
    sumIntervals(scheduled) - getExcusedMinutes(scheduled, excuses)
  if (punchRecords.length === 0) {
    return { ...journey, expected, absence: expected }
  }

  const punchTimes = punchRecords.map(({ datetime }) => toMinutes(datetime))
  const balance = isWithinTolerance(punchTimes, scheduled)
    ? 0
    : worked - expected
  return {
    ...journey,
    expected,
    lateness: Math.max(0, -balance),
    overtime60: Math.max(0, balance)
  }
}
