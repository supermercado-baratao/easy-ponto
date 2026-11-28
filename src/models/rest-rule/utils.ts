import type {
  RestRule,
  RestRuleConstraint,
  ShiftAssignment,
  TRestRuleWithRelations
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import {
  getUsualWorkday,
  isInEffect,
  toPairs,
  type TResolvedDay,
  type TShiftAssignmentInput,
  type TShiftPair
} from '@/models/shift-assignment/utils'
import { selectVersionInEffect } from '@/models/shift-pattern/utils'

export const REST_CONSTRAINTS = [
  'same-month',
  'blocked-weekdays',
  'no-holiday',
  'same-load'
] as const

export type TRestConstraint = (typeof REST_CONSTRAINTS)[number]

// `handleFormAction` turns the FormData into a flat object, so each constraint is a pair of fields,
// `<name>Level` and `<name>Position`
export const REST_CONSTRAINT_FIELD_NAMES = {
  'same-month': 'sameMonth',
  'blocked-weekdays': 'blockedWeekdays',
  'no-holiday': 'noHoliday',
  'same-load': 'sameLoad'
} as const satisfies Record<TRestConstraint, string>

type TRestConstraintFieldName =
  (typeof REST_CONSTRAINT_FIELD_NAMES)[TRestConstraint]

export type TRestConstraintField =
  `${TRestConstraintFieldName}Level` | `${TRestConstraintFieldName}Position`

export const REST_CONSTRAINT_LEVELS = ['required', 'preferred'] as const

export type TRestConstraintLevel = (typeof REST_CONSTRAINT_LEVELS)[number]

export const HOLIDAY_REST_POLICIES = ['always', 'window', 'never'] as const

export type THolidayRestPolicy = (typeof HOLIDAY_REST_POLICIES)[number]

export const MAX_REST_DISTANCE = 15

export const MAX_WINDOW_DAY = 31

export type TRestRuleInput = Pick<
  RestRule,
  | 'id'
  | 'name'
  | 'windowStartDay'
  | 'windowEndDay'
  | 'distances'
  | 'blockedWeekdays'
  | 'holidayRest'
> & {
  shiftPatternIds: string[]
  constraints: Pick<RestRuleConstraint, 'constraint' | 'level' | 'position'>[]
}

export const toRestRuleInput = ({
  shiftPatterns,
  constraints,
  ...rule
}: TRestRuleWithRelations): TRestRuleInput => ({
  ...rule,
  shiftPatternIds: shiftPatterns.map(({ shiftPatternId }) => shiftPatternId),
  constraints
})

export type TRestUserDays = {
  userId: string
  assignments: (TShiftAssignmentInput &
    Pick<ShiftAssignment, 'shiftPatternId'>)[]
  days: TResolvedDay[]
}

// A day off on a holiday that doesn't count as the rest keeps the holiday, so nothing is worked in its place
export type TRestMoveReason = 'outside-window' | 'holiday'

export type TRestMove = {
  userId: string
  ruleId: string
  ruleName: string
  shiftAssignmentId: string
  date: string
  reason: TRestMoveReason
  target: string | null
  unmetConstraints: TRestConstraint[]
}

export type TRuleAdjustment = {
  userId: string
  date: string
  kind: 'work' | 'off'
  shiftAssignmentId: string | null
}

const DATE_FORMAT = 'YYYY-MM-DD'

export const isInWindow = (
  {
    windowStartDay,
    windowEndDay
  }: Pick<RestRule, 'windowStartDay' | 'windowEndDay'>,
  date: string
): boolean => {
  const day = dayjs(date)
  const lastDay = Math.min(windowEndDay, day.daysInMonth())
  return windowStartDay <= day.date() && day.date() <= lastDay
}

const findRuleOfDay = (
  rules: TRestRuleInput[],
  assignments: TRestUserDays['assignments'],
  date: string
): { rule: TRestRuleInput; assignment: TShiftAssignmentInput } | null => {
  for (const assignment of assignments) {
    if (!isInEffect(assignment, date)) continue
    const rule = rules.find(({ shiftPatternIds }) =>
      shiftPatternIds.includes(assignment.shiftPatternId)
    )
    if (rule) return { rule, assignment }
  }
  return null
}

export const getRestMoveReason = (
  day: TResolvedDay,
  rule: Pick<TRestRuleInput, 'windowStartDay' | 'windowEndDay' | 'holidayRest'>,
  isHoliday: boolean
): TRestMoveReason | null => {
  if (day.kind !== 'off' || day.adjusted) return null
  const inWindow = isInWindow(rule, day.date)
  if (!isHoliday) return inWindow ? null : 'outside-window'
  if (rule.holidayRest === 'always') return null
  if (inWindow && rule.holidayRest === 'window') return null
  return 'holiday'
}

const getLoad = (pairs: TShiftPair[]): number =>
  pairs.reduce((total, { entry, exit }) => total + exit - entry, 0)

const getUsualLoad = (
  assignment: TShiftAssignmentInput,
  date: string
): number | null => {
  const version = selectVersionInEffect(assignment.shiftPattern.versions, date)
  const workday = version ? getUsualWorkday(version) : null
  return workday ? getLoad(toPairs(workday)) : null
}

// The day before the window moves forward and the day after it moves back, so the first try stays in the
// month; the other direction comes next at the same distance
const getCandidateDates = (rule: TRestRuleInput, date: string): string[] => {
  const day = dayjs(date)
  const direction = day.date() > rule.windowEndDay ? -1 : 1
  return rule.distances.flatMap((distance) => [
    day.add(distance * direction, 'day').format(DATE_FORMAT),
    day.subtract(distance * direction, 'day').format(DATE_FORMAT)
  ])
}

const meetsConstraint = (
  constraint: TRestConstraint,
  {
    rule,
    date,
    candidate,
    isHoliday,
    expectedLoad
  }: {
    rule: TRestRuleInput
    date: string
    candidate: TResolvedDay
    isHoliday: (date: string) => boolean
    expectedLoad: number | null
  }
): boolean => {
  switch (constraint) {
    case 'same-month': {
      return candidate.date.slice(0, 7) === date.slice(0, 7)
    }
    case 'blocked-weekdays': {
      return !rule.blockedWeekdays.includes(dayjs(candidate.date).day())
    }
    case 'no-holiday': {
      return !isHoliday(candidate.date)
    }
    case 'same-load': {
      return expectedLoad === null || getLoad(candidate.pairs) === expectedLoad
    }
  }
}

// The preferred constraint of the lowest position yields first, so the higher positions weigh more
const getPreferredConstraints = (rule: TRestRuleInput): TRestConstraint[] =>
  rule.constraints
    .filter(({ level }) => level === 'preferred')
    .toSorted((a, b) => (b.position ?? 0) - (a.position ?? 0))
    .map(({ constraint }) => constraint as TRestConstraint)

const getRequiredConstraints = (rule: TRestRuleInput): TRestConstraint[] =>
  rule.constraints
    .filter(({ level }) => level === 'required')
    .map(({ constraint }) => constraint as TRestConstraint)

const compareSatisfaction = (a: boolean[], b: boolean[]): number => {
  for (const [index, satisfied] of a.entries()) {
    if (satisfied !== b[index]) return satisfied ? -1 : 1
  }
  return 0
}

const findTarget = ({
  rule,
  date,
  reason,
  assignment,
  daysByDate,
  takenDates,
  isHoliday
}: {
  rule: TRestRuleInput
  date: string
  reason: TRestMoveReason
  assignment: TShiftAssignmentInput
  daysByDate: Map<string, TResolvedDay>
  takenDates: Set<string>
  isHoliday: (date: string) => boolean
}): Pick<TRestMove, 'target' | 'unmetConstraints'> => {
  // On a holiday nothing is worked in place of the day off, so there is no load to keep
  const expectedLoad =
    reason === 'holiday' ? null : getUsualLoad(assignment, date)
  const required = getRequiredConstraints(rule)
  const preferred = getPreferredConstraints(rule)
  const candidates: { date: string; satisfaction: boolean[] }[] = []
  for (const candidateDate of getCandidateDates(rule, date)) {
    const candidate = daysByDate.get(candidateDate)
    if (
      !candidate ||
      candidate.kind !== 'work' ||
      candidate.adjusted ||
      takenDates.has(candidateDate) ||
      !isInWindow(rule, candidateDate)
    )
      continue
    const context = { rule, date, candidate, isHoliday, expectedLoad }
    if (required.some((constraint) => !meetsConstraint(constraint, context)))
      continue
    candidates.push({
      date: candidateDate,
      satisfaction: preferred.map((constraint) =>
        meetsConstraint(constraint, context)
      )
    })
  }
  const [best] = candidates.toSorted((a, b) =>
    compareSatisfaction(a.satisfaction, b.satisfaction)
  )
  if (!best) return { target: null, unmetConstraints: [] }
  return {
    target: best.date,
    unmetConstraints: preferred.filter(
      (_constraint, index) => best.satisfaction[index] === false
    )
  }
}

export const findRestMoves = ({
  rules,
  users,
  isHoliday
}: {
  rules: TRestRuleInput[]
  users: TRestUserDays[]
  isHoliday: (date: string) => boolean
}): TRestMove[] =>
  users
    .flatMap(({ userId, assignments, days }) => {
      const daysByDate = new Map(days.map((day) => [day.date, day]))
      const takenDates = new Set<string>()
      const moves: TRestMove[] = []
      const chronologicalDays = days.toSorted((a, b) =>
        a.date.localeCompare(b.date)
      )
      for (const day of chronologicalDays) {
        const match = findRuleOfDay(rules, assignments, day.date)
        if (!match) continue
        const { rule, assignment } = match
        const reason = getRestMoveReason(day, rule, isHoliday(day.date))
        if (!reason) continue
        const result = findTarget({
          rule,
          date: day.date,
          reason,
          assignment,
          daysByDate,
          takenDates,
          isHoliday
        })
        if (result.target) takenDates.add(result.target)
        moves.push({
          userId,
          ruleId: rule.id,
          ruleName: rule.name,
          shiftAssignmentId: assignment.id,
          date: day.date,
          reason,
          ...result
        })
      }
      return moves
    })
    .toSorted((a, b) => a.date.localeCompare(b.date))

// The day off left on a holiday is also saved, so it counts as handled and leaves the pending items
export const toRuleAdjustments = (moves: TRestMove[]): TRuleAdjustment[] =>
  moves.flatMap(({ userId, date, reason, target, shiftAssignmentId }) =>
    target
      ? [
          reason === 'holiday'
            ? { userId, date, kind: 'off' as const, shiftAssignmentId: null }
            : { userId, date, kind: 'work' as const, shiftAssignmentId },
          {
            userId,
            date: target,
            kind: 'off' as const,
            shiftAssignmentId: null
          }
        ]
      : []
  )

export const findUnmovedRests = ({
  rules,
  users,
  isHoliday
}: {
  rules: TRestRuleInput[]
  users: TRestUserDays[]
  isHoliday: (date: string) => boolean
}): { userId: string; date: string; ruleName: string }[] =>
  users.flatMap(({ userId, assignments, days }) =>
    days
      .map((day) => ({
        day,
        match: findRuleOfDay(rules, assignments, day.date)
      }))
      .filter(
        ({ day, match }) =>
          match && getRestMoveReason(day, match.rule, isHoliday(day.date))
      )
      .map(({ day, match }) => ({
        userId,
        date: day.date,
        ruleName: match!.rule.name
      }))
  )

export const isSameRestRuleName = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase()
