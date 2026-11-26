import type {
  PunchRecord,
  ScheduleDay,
  TJustificationWithType
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { DEFAULT_JOURNEY_RULES } from '@/models/journey-rules/utils'
import { TIME_PAIRS } from '@/models/schedule/utils'

import type {
  TJourney,
  TJourneyDay,
  TJourneyDayInput,
  TJourneyPair,
  TJourneyTotals,
  TScheduleAlert,
  TScheduleDaySummary
} from './types'

// Read from the company's rules in #108
export const PUNCH_TOLERANCE = DEFAULT_JOURNEY_RULES.punchTolerance
export const DAILY_TOLERANCE = DEFAULT_JOURNEY_RULES.dailyTolerance
export const MAX_LUNCH = DEFAULT_JOURNEY_RULES.maxLunch
export const MAX_CONTINUOUS_WORK = DEFAULT_JOURNEY_RULES.maxContinuousWork
export const MAX_DAILY_JOURNEY = DEFAULT_JOURNEY_RULES.maxDailyJourney

// The store's planned workload: 7:20 in the middle of the month and 8:00 at its start and end, when
// sales peak. Provisional until the CLT review of the journey rules (#65)
export const STANDARD_WORKLOAD = 440
export const PEAK_WORKLOAD = 480
export const MID_MONTH_FIRST_DAY = 11
export const MID_MONTH_LAST_DAY = 26

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

const getCoveredMinutes = (
  scheduled: TInterval[],
  justifications: TJustificationWithType[]
): number => {
  const covered = justifications
    .map(({ startTime, endTime }) => ({ start: startTime, end: endTime }))
    .filter(isInterval)
  let total = 0
  for (const interval of scheduled) {
    for (const cover of covered) total += getOverlap(interval, cover)
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
    compensation: 0,
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
    sumIntervals(scheduled) - getCoveredMinutes(scheduled, excuses)
  const deductions = justifications.filter(
    ({ type }) => type.effect === 'deduct'
  )
  const compensation = deductions.some(({ startTime }) => startTime === null)
    ? expected
    : Math.min(expected, getCoveredMinutes(scheduled, deductions))
  const due = expected - compensation
  if (punchRecords.length === 0) {
    return { ...journey, expected, compensation, absence: due }
  }

  const punchTimes = punchRecords.map(({ datetime }) => toMinutes(datetime))
  const balance =
    compensation === 0 && isWithinTolerance(punchTimes, scheduled)
      ? 0
      : worked - due
  return {
    ...journey,
    expected,
    compensation,
    lateness: Math.max(0, -balance),
    overtime60: Math.max(0, balance)
  }
}

export const isCalculated = ({ kind }: Pick<TJourney, 'kind'>): boolean =>
  kind !== 'no-schedule' && kind !== 'future'

export const sumDays = (days: TJourneyDay[]): TJourneyTotals => {
  const totals: TJourneyTotals = {
    expected: 0,
    worked: 0,
    absence: 0,
    lateness: 0,
    compensation: 0,
    overtime60: 0,
    overtime100: 0
  }
  for (const { journey } of days) {
    if (!isCalculated(journey)) continue
    totals.expected += journey.expected
    totals.worked += journey.worked
    totals.absence += journey.absence
    totals.lateness += journey.lateness
    totals.compensation += journey.compensation
    totals.overtime60 += journey.overtime60
    totals.overtime100 += journey.overtime100
  }
  return totals
}

export const summarizeScheduleDay = (
  scheduleDay?: ScheduleDay
): TScheduleDaySummary => {
  const scheduled = getScheduledIntervals(scheduleDay)
  const lunch = scheduled
    .slice(1)
    .reduce(
      (total, { start }, index) => total + start - scheduled[index].end,
      0
    )
  const journey = sumIntervals(scheduled)
  const alerts: TScheduleAlert[] = []
  if (lunch > MAX_LUNCH) alerts.push('long-lunch')
  if (journey > MAX_DAILY_JOURNEY) alerts.push('long-journey')
  if (scheduled.some(({ start, end }) => end - start > MAX_CONTINUOUS_WORK)) {
    alerts.push('long-continuous-work')
  }
  return {
    pairs: scheduled.map(({ start, end }) => ({ entry: start, exit: end })),
    lunch,
    journey,
    alerts
  }
}
