import type {
  PunchRecord,
  TJustificationWithType
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { TDayKind } from '@/models/journey-rules/utils'
import type { TShiftPair } from '@/models/shift-assignment/utils'

import type {
  TJourney,
  TJourneyCalculationRules,
  TJourneyDay,
  TJourneyDayInput,
  TJourneyPair,
  TJourneyTotals,
  TOvertime,
  TScheduleAlert,
  TScheduleAlertLimits,
  TScheduleDaySummary
} from './types'

// The overtime of a company without bands yet (#105) is kept apart instead of guessing a percentage
export const UNBANDED_PERCENTAGE = 0

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

const toIntervals = (pairs: TShiftPair[]): TInterval[] =>
  pairs.map(({ entry, exit }) => ({ start: entry, end: exit }))

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
  scheduled: TInterval[],
  { punchTolerance, dailyTolerance }: TJourneyCalculationRules['journeyRules']
): boolean => {
  const scheduledTimes = scheduled.flatMap(({ start, end }) => [start, end])
  if (punchTimes.length !== scheduledTimes.length) return false
  const variations = punchTimes.map((time, index) =>
    Math.abs(time - scheduledTimes[index])
  )
  return (
    variations.every((variation) => variation <= punchTolerance) &&
    variations.reduce((total, variation) => total + variation, 0) <=
      dailyTolerance
  )
}

export const mergeOvertime = (...overtimes: TOvertime[]): TOvertime => {
  const minutesByPercentage = new Map<number, number>()
  for (const { percentage, minutes } of overtimes.flat()) {
    minutesByPercentage.set(
      percentage,
      (minutesByPercentage.get(percentage) ?? 0) + minutes
    )
  }
  return [...minutesByPercentage]
    .filter(([, minutes]) => minutes !== 0)
    .map(([percentage, minutes]) => ({ percentage, minutes }))
    .toSorted((a, b) => a.percentage - b.percentage)
}

export const sumOvertime = (overtime: TOvertime): number =>
  overtime.reduce((total, { minutes }) => total + minutes, 0)

export const getOvertimeMinutes = (
  overtime: TOvertime,
  percentage: number
): number =>
  overtime.find((item) => item.percentage === percentage)?.minutes ?? 0

export const splitOvertime = (
  minutes: number,
  dayKind: TDayKind,
  overtimeBands: TJourneyCalculationRules['overtimeBands']
): TOvertime => {
  if (minutes <= 0) return []
  const bands = overtimeBands
    .filter((band) => band.dayKind === dayKind)
    .toSorted((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity))
  if (bands.length === 0) {
    return [{ percentage: UNBANDED_PERCENTAGE, minutes }]
  }

  const overtime: TOvertime = []
  let previousUpTo = 0
  for (const [index, { upTo, percentage }] of bands.entries()) {
    const isLast = index === bands.length - 1
    const limit = isLast ? Infinity : (upTo ?? Infinity)
    const bandMinutes = Math.min(minutes, limit) - previousUpTo
    if (bandMinutes > 0) overtime.push({ percentage, minutes: bandMinutes })
    if (minutes <= limit) break
    previousUpTo = limit
  }
  return mergeOvertime(overtime)
}

export const getOvertimePercentages = ({
  overtimeBands,
  overtimes
}: {
  overtimeBands: Pick<
    TJourneyCalculationRules['overtimeBands'][number],
    'percentage'
  >[]
  overtimes: TOvertime[]
}): number[] =>
  [
    ...new Set([
      ...overtimeBands.map(({ percentage }) => percentage),
      ...overtimes.flat().map(({ percentage }) => percentage)
    ])
  ].toSorted((a, b) => a - b)

export const calculateDay = ({
  date,
  punchRecords,
  shiftDay,
  holiday,
  justifications,
  rules,
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
    overtime: []
  }
  if (date > today) return { ...journey, kind: 'future' }
  const getOvertime = (minutes: number, dayKind: TDayKind): TOvertime =>
    splitOvertime(minutes, dayKind, rules.overtimeBands)

  if (holiday) {
    return {
      ...journey,
      kind: 'holiday',
      overtime: getOvertime(worked, 'holiday')
    }
  }
  if (!shiftDay || shiftDay.kind === 'unassigned') {
    return { ...journey, kind: 'no-schedule' }
  }

  const scheduled = toIntervals(shiftDay.pairs)
  if (scheduled.length === 0) {
    return {
      ...journey,
      kind: 'day-off',
      overtime: getOvertime(worked, 'day-off')
    }
  }

  const excuses = justifications.filter(({ type }) => type.effect === 'excuse')
  if (excuses.some(({ startTime }) => startTime === null)) {
    return {
      ...journey,
      kind: 'excused',
      overtime: getOvertime(worked, 'workday')
    }
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
    compensation === 0 &&
    isWithinTolerance(punchTimes, scheduled, rules.journeyRules)
      ? 0
      : worked - due
  return {
    ...journey,
    expected,
    compensation,
    lateness: Math.max(0, -balance),
    overtime: getOvertime(balance, 'workday')
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
    overtime: []
  }
  for (const { journey } of days) {
    if (!isCalculated(journey)) continue
    totals.expected += journey.expected
    totals.worked += journey.worked
    totals.absence += journey.absence
    totals.lateness += journey.lateness
    totals.compensation += journey.compensation
    totals.overtime = mergeOvertime(totals.overtime, journey.overtime)
  }
  return totals
}

// The schedule agenda and its pending items look at the same days, from today on
export const SCHEDULE_AGENDA_DAYS = 7

export const summarizeScheduleDay = (
  pairs: TShiftPair[],
  { maxLunch, maxDailyJourney, maxContinuousWork }: TScheduleAlertLimits
): TScheduleDaySummary => {
  const scheduled = toIntervals(pairs)
  const lunch = scheduled
    .slice(1)
    .reduce(
      (total, { start }, index) => total + start - scheduled[index].end,
      0
    )
  const journey = sumIntervals(scheduled)
  const alerts: TScheduleAlert[] = []
  if (lunch > maxLunch) alerts.push('long-lunch')
  if (journey > maxDailyJourney) alerts.push('long-journey')
  if (scheduled.some(({ start, end }) => end - start > maxContinuousWork)) {
    alerts.push('long-continuous-work')
  }
  return { pairs, lunch, journey, alerts }
}
