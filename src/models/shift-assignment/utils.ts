import type {
  ShiftAdjustment,
  ShiftAssignment,
  TShiftPatternWithVersions
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { TIME_PAIRS } from '@/models/schedule/utils'
import {
  getDayTimes,
  isDayOff,
  MAX_CYCLE_LENGTH,
  MINUTES_PER_DAY,
  selectVersionInEffect,
  type TCycleDayTimes
} from '@/models/shift-pattern/utils'

export const SHIFT_ADJUSTMENT_KINDS = ['work', 'off', 'custom'] as const

export type TShiftAdjustmentKind = (typeof SHIFT_ADJUSTMENT_KINDS)[number]

export const MAX_DAY_PAIRS = TIME_PAIRS.length

export type TShiftAssignmentInput = Pick<
  ShiftAssignment,
  'id' | 'startDate' | 'endDate' | 'cycleStartDay'
> & { shiftPattern: Pick<TShiftPatternWithVersions, 'versions'> }

export type TShiftAdjustmentInput = Pick<
  ShiftAdjustment,
  'date' | 'kind' | 'shiftAssignmentId'
> &
  TCycleDayTimes

export type TShiftPair = { entry: number; exit: number }

export type TResolvedDay = {
  date: string
  kind: 'work' | 'off' | 'unassigned'
  pairs: TShiftPair[]
  adjusted: boolean
}

const DATE_FORMAT = 'YYYY-MM-DD'

export const isInEffect = (
  { startDate, endDate }: Pick<ShiftAssignment, 'startDate' | 'endDate'>,
  date: string
): boolean => startDate <= date && (endDate === null || date <= endDate)

export const getCycleDay = (
  {
    startDate,
    cycleStartDay
  }: Pick<ShiftAssignment, 'startDate' | 'cycleStartDay'>,
  cycleLength: number,
  date: string
): number => {
  const elapsedDays = dayjs(date).diff(dayjs(startDate), 'day')
  const index = (cycleStartDay - 1 + elapsedDays) % cycleLength
  return ((index + cycleLength) % cycleLength) + 1
}

export const toPairs = (times: TCycleDayTimes): TShiftPair[] =>
  TIME_PAIRS.filter(
    ({ entry, exit }) => times[entry] !== null && times[exit] !== null
  ).map(({ entry, exit }) => ({ entry: times[entry]!, exit: times[exit]! }))

const getPatternDay = (
  assignment: TShiftAssignmentInput,
  date: string
): TCycleDayTimes | null => {
  const version = selectVersionInEffect(assignment.shiftPattern.versions, date)
  if (!version) return null
  const cycleDay = getCycleDay(assignment, version.cycleLength, date)
  return version.days.find((day) => day.cycleDay === cycleDay) ?? null
}

// The workday that repeats the most is the pattern's load, the one a swapped day off follows
export const getUsualWorkday = (version: {
  days: TCycleDayTimes[]
}): TCycleDayTimes | null => {
  const workdays = version.days.filter((day) => !isDayOff(day))
  let usual: TCycleDayTimes | null = null
  let usualCount = 0
  for (const workday of workdays) {
    const key = getDayTimes(workday).join(',')
    const count = workdays.filter(
      (day) => getDayTimes(day).join(',') === key
    ).length
    if (!(count > usualCount)) {
      continue
    }

    usual = workday
    usualCount = count
  }
  return usual
}

const sortPairs = (pairs: TShiftPair[]): TShiftPair[] =>
  pairs.toSorted((a, b) => a.entry - b.entry)

const toResolvedDay = (
  date: string,
  pairs: TShiftPair[],
  adjusted: boolean
): TResolvedDay => ({
  date,
  kind: pairs.length > 0 ? 'work' : 'off',
  pairs: sortPairs(pairs),
  adjusted
})

const resolveAdjustment = (
  adjustment: TShiftAdjustmentInput,
  assignments: TShiftAssignmentInput[]
): TResolvedDay => {
  const { date } = adjustment
  if (adjustment.kind === 'custom') {
    return toResolvedDay(date, toPairs(adjustment), true)
  }
  if (adjustment.kind === 'work') {
    const assignment = assignments.find(
      ({ id }) => id === adjustment.shiftAssignmentId
    )
    const version =
      assignment &&
      selectVersionInEffect(assignment.shiftPattern.versions, date)
    const workday = version ? getUsualWorkday(version) : null
    return toResolvedDay(date, workday ? toPairs(workday) : [], true)
  }
  return toResolvedDay(date, [], true)
}

export const resolveDay = ({
  date,
  assignments,
  adjustments
}: {
  date: string
  assignments: TShiftAssignmentInput[]
  adjustments: TShiftAdjustmentInput[]
}): TResolvedDay => {
  const adjustment = adjustments.find((adjustment) => adjustment.date === date)
  if (adjustment) return resolveAdjustment(adjustment, assignments)

  const inEffect = assignments.filter((assignment) =>
    isInEffect(assignment, date)
  )
  if (inEffect.length === 0) {
    return { date, kind: 'unassigned', pairs: [], adjusted: false }
  }
  return toResolvedDay(
    date,
    inEffect.flatMap((assignment) => {
      const day = getPatternDay(assignment, date)
      return day ? toPairs(day) : []
    }),
    false
  )
}

export const resolveDays = ({
  initialDate,
  finalDate,
  assignments,
  adjustments
}: {
  initialDate: string
  finalDate: string
  assignments: TShiftAssignmentInput[]
  adjustments: TShiftAdjustmentInput[]
}): TResolvedDay[] => {
  const days: TResolvedDay[] = []
  for (
    let date = dayjs(initialDate);
    !date.isAfter(dayjs(finalDate), 'day');
    date = date.add(1, 'day')
  ) {
    days.push(
      resolveDay({ date: date.format(DATE_FORMAT), assignments, adjustments })
    )
  }
  return days
}

export type TShiftConflict = {
  date: string
  reason: 'overlap' | 'too-many-pairs'
}

const findDayConflict = (
  pairs: TShiftPair[],
  previousPairs: TShiftPair[]
): TShiftConflict['reason'] | null => {
  if (pairs.length > MAX_DAY_PAIRS) return 'too-many-pairs'
  for (const [index, pair] of pairs.entries()) {
    const next = pairs[index + 1]
    if (next && next.entry < pair.exit) return 'overlap'
  }
  const previousLastExit = Math.max(...previousPairs.map(({ exit }) => exit), 0)
  const firstEntry = pairs[0]?.entry
  return firstEntry !== undefined &&
    firstEntry + MINUTES_PER_DAY < previousLastExit
    ? 'overlap'
    : null
}

const greatestCommonDivisor = (a: number, b: number): number =>
  b === 0 ? a : greatestCommonDivisor(b, a % b)

const leastCommonMultiple = (a: number, b: number): number =>
  (a * b) / greatestCommonDivisor(a, b)

// Past the last start, end or version of the patterns involved, the days repeat every common
// multiple of their cycles, so checking one such period covers every later date
const getConflictCheckEndDate = (
  assignment: TShiftAssignmentInput,
  others: TShiftAssignmentInput[]
): string => {
  const involved = [assignment, ...others]
  const events = involved.flatMap(({ startDate, endDate, shiftPattern }) => [
    startDate,
    ...(endDate ? [endDate] : []),
    ...shiftPattern.versions.map(({ startDate }) => startDate)
  ])
  const lastEvent = events.toSorted((a, b) => a.localeCompare(b)).at(-1)!
  let period = 1
  for (const { shiftPattern } of involved) {
    for (const { cycleLength } of shiftPattern.versions) {
      period = leastCommonMultiple(period, cycleLength)
    }
  }
  const periodicEnd = dayjs(lastEvent)
    .add(Math.max(period, MAX_CYCLE_LENGTH), 'day')
    .format(DATE_FORMAT)
  return assignment.endDate && assignment.endDate < periodicEnd
    ? assignment.endDate
    : periodicEnd
}

// Pairs of patterns in effect on the same day add up, so they must not overlap and must fit the
// pairs a day holds
export const findShiftConflict = (
  assignment: TShiftAssignmentInput,
  others: TShiftAssignmentInput[]
): TShiftConflict | null => {
  const overlapping = others.filter(
    (other) =>
      (other.endDate === null || other.endDate >= assignment.startDate) &&
      (assignment.endDate === null || other.startDate <= assignment.endDate)
  )
  if (overlapping.length === 0) return null

  const assignments = [assignment, ...overlapping]
  const finalDate = getConflictCheckEndDate(assignment, overlapping)
  const days = resolveDays({
    initialDate: dayjs(assignment.startDate)
      .subtract(1, 'day')
      .format(DATE_FORMAT),
    finalDate: dayjs(finalDate).add(1, 'day').format(DATE_FORMAT),
    assignments,
    adjustments: []
  })
  for (const [index, day] of days.entries()) {
    if (index === 0) continue
    const reason = findDayConflict(day.pairs, days[index - 1].pairs)
    if (reason) return { date: day.date, reason }
  }
  return null
}
