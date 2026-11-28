import { WEEKDAYS } from '@/constants/time'
import type { UserGroup } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import {
  findRestBreaks,
  type TRestRestrictionInput,
  type TRestRestrictionSummary
} from '@/models/rest-restriction/utils'
import {
  isInWindow,
  type TRestConstraint,
  type TRestMove,
  type TRestPlanUser,
  type TRestRuleInput
} from '@/models/rest-rule/utils'
import type { TResolvedDay } from '@/models/shift-assignment/utils'
import { getDescendantIds, getGroupLabel } from '@/models/user-group/utils'

export const MAX_REPORT_MONTHS = 12

const DATE_FORMAT = 'YYYY-MM-DD'

const MINUTES_IN_DAY = 1440

export type TReportDay = { date: string; off: number }

export type TReportUser = {
  id: string
  name: string
  groupIds: string[]
  shiftPatternNames: string[]
}

export type TReportMonthInput = {
  month: string
  initialDate: string
  finalDate: string
  users: Pick<TRestPlanUser, 'userId' | 'baseDays' | 'days'>[]
  moves: TRestMove[]
  upToDate: boolean
}

export type TScheduleReportEmployee = {
  userId: string
  name: string
  groupNames: string[]
  shiftPatternNames: string[]
  cycleRestWeekdays: number[]
  cycleRests: number
  movedRests: number
  postponedRests: number
  advancedRests: number
  unmovedRests: number
  balance: number
}

// A null group is every employee of the report
export type TWeekdayRests = {
  groupId: string | null
  name: string | null
  members: number
  weekdays: { weekday: number; average: number }[]
}

export type TPresenceTable = {
  groupId: string | null
  name: string | null
  rows: { weekday: number; values: number[] }[]
}

export type TScheduleReportMonth = {
  month: string
  total: number
  windowAverage: number | null
  worstDay: TReportDay | null
  daysAboveLimit: number | null
  upToDate: boolean
}

export type TGroupWorstDay = {
  groupId: string
  name: string
  members: number
  worstDay: TReportDay | null
}

export type TUnmetRule =
  | {
      kind: 'constraint'
      ruleName: string
      constraint: TRestConstraint
      dates: string[]
    }
  | {
      kind: 'restriction'
      restriction: TRestRestrictionSummary
      dates: string[]
    }

export type TAttentionPoint =
  | { kind: 'outdated-month'; month: string }
  | { kind: 'unmoved-rest'; userName: string; date: string; ruleName: string }
  | {
      kind: 'required-restriction-break'
      restriction: TRestRestrictionSummary
      date: string
    }
  | { kind: 'single-member-group'; groupName: string }
  | { kind: 'without-schedule'; userName: string }

export type TScheduleReport = {
  initialDate: string
  finalDate: string
  limit: number | null
  indicators: {
    employees: number
    movedRests: number
    unmovedRests: number
    worstDay: TReportDay | null
  }
  employees: TScheduleReportEmployee[]
  rests: TWeekdayRests[]
  hours: number[]
  presence: TPresenceTable[]
  months: TScheduleReportMonth[]
  groupWorstDays: TGroupWorstDay[]
  unmetRules: TUnmetRule[]
  attentionPoints: TAttentionPoint[]
  shiftPatterns: { name: string; employees: number }[]
}

type TReportGroup = Pick<UserGroup, 'id' | 'name' | 'parentId'>

type TEmployeeDays = {
  user: TReportUser
  baseDays: TResolvedDay[]
  days: TResolvedDay[]
}

const roundAverage = (value: number): number => Math.round(value * 10) / 10

const compareNames = (a: string, b: string): number =>
  a.localeCompare(b, 'pt-BR')

export const getReportMonths = (
  initialMonth: string,
  finalMonth: string
): string[] => {
  const months: string[] = []
  for (
    let month = dayjs(`${initialMonth}-01`);
    month.format('YYYY-MM') <= finalMonth;
    month = month.add(1, 'month')
  ) {
    months.push(month.format('YYYY-MM'))
  }
  return months
}

const getDates = (initialDate: string, finalDate: string): string[] => {
  const dates: string[] = []
  for (
    let date = dayjs(initialDate);
    !date.isAfter(dayjs(finalDate), 'day');
    date = date.add(1, 'day')
  ) {
    dates.push(date.format(DATE_FORMAT))
  }
  return dates
}

const getLoad = ({ pairs }: Pick<TResolvedDay, 'pairs'>): number =>
  pairs.reduce((total, { entry, exit }) => total + exit - entry, 0)

const isCycleRest = ({ kind, adjusted }: TResolvedDay): boolean =>
  kind === 'off' && !adjusted

// A day with no one off isn't a worst day, so an empty month has none
const findWorstDay = (
  dates: string[],
  countOff: (date: string) => number
): TReportDay | null => {
  let worst: TReportDay | null = null
  for (const date of dates) {
    const off = countOff(date)
    if (off > 0 && (!worst || off > worst.off)) worst = { date, off }
  }
  return worst
}

const getGroupUserIds = (
  groups: TReportGroup[],
  groupId: string,
  users: TReportUser[]
): Set<string> => {
  const groupIds = getDescendantIds(groups, groupId).add(groupId)
  return new Set(
    users
      .filter((user) => user.groupIds.some((id) => groupIds.has(id)))
      .map(({ id }) => id)
  )
}

const summarizeEmployee = (
  { user, baseDays, days }: TEmployeeDays,
  {
    moves,
    groups,
    isHoliday
  }: {
    moves: TRestMove[]
    groups: TReportGroup[]
    isHoliday: (date: string) => boolean
  }
): TScheduleReportEmployee => {
  const userMoves = moves.filter(({ userId }) => userId === user.id)
  const cycleRests = baseDays.filter((day) => isCycleRest(day))
  // A holiday has no load, as in the journey, so moving a rest off a holiday costs the load of the day it moves to
  const sumLoad = (list: TResolvedDay[]): number =>
    list
      .filter(({ date }) => !isHoliday(date))
      .reduce((total, day) => total + getLoad(day), 0)
  return {
    userId: user.id,
    name: user.name,
    groupNames: user.groupIds
      .map((id) => getGroupLabel(groups, id))
      .filter(Boolean)
      .toSorted(compareNames),
    shiftPatternNames: user.shiftPatternNames,
    cycleRestWeekdays: WEEKDAYS.map(({ weekday }) => weekday).filter(
      (weekday) => cycleRests.some(({ date }) => dayjs(date).day() === weekday)
    ),
    cycleRests: cycleRests.length,
    movedRests: userMoves.filter(({ target }) => target !== null).length,
    postponedRests: userMoves.filter(
      ({ date, target }) => target !== null && target > date
    ).length,
    advancedRests: userMoves.filter(
      ({ date, target }) => target !== null && target < date
    ).length,
    unmovedRests: userMoves.filter(({ target }) => target === null).length,
    balance: sumLoad(days) - sumLoad(baseDays)
  }
}

const summarizeWeekdayRests = (
  employees: TEmployeeDays[],
  dates: string[]
): TWeekdayRests['weekdays'] =>
  WEEKDAYS.map(({ weekday }) => {
    const occurrences = dates.filter(
      (date) => dayjs(date).day() === weekday
    ).length
    const rests = employees.reduce(
      (total, { baseDays }) =>
        total +
        baseDays.filter(
          (day) => isCycleRest(day) && dayjs(day.date).day() === weekday
        ).length,
      0
    )
    return {
      weekday,
      average: occurrences > 0 ? roundAverage(rests / occurrences) : 0
    }
  })

// The half of each hour stands for it, so a shift ending at 16:00 doesn't count in 16h; a shift past
// midnight counts in the day it reaches
const countPresence = (
  employees: TEmployeeDays[],
  dates: string[],
  isHoliday: (date: string) => boolean
): Map<string, number[]> => {
  const counted = new Set(dates.filter((date) => !isHoliday(date)))
  const presence = new Map<string, number[]>(
    [...counted].map((date) => [date, Array.from({ length: 24 }, () => 0)])
  )
  for (const { days } of employees) {
    for (const day of days) {
      if (day.kind !== 'work' || !counted.has(day.date)) continue
      const next = dayjs(day.date).add(1, 'day').format(DATE_FORMAT)
      for (let hour = 0; hour < 48; hour++) {
        const minute = hour * 60 + 30
        if (
          day.pairs.every(
            ({ entry, exit }) => !(entry <= minute && minute < exit)
          )
        )
          continue
        const hours = presence.get(minute < MINUTES_IN_DAY ? day.date : next)
        if (hours) hours[hour % 24] += 1
      }
    }
  }
  return presence
}

const summarizePresence = (
  presence: Map<string, number[]>
): TPresenceTable['rows'] =>
  WEEKDAYS.map(({ weekday }) => {
    const dates = presence
      .keys()
      .filter((date) => dayjs(date).day() === weekday)
      .toArray()
    return {
      weekday,
      values: Array.from({ length: 24 }, (_, hour) =>
        dates.length > 0
          ? roundAverage(
              dates.reduce(
                (total, date) => total + presence.get(date)![hour],
                0
              ) / dates.length
            )
          : 0
      )
    }
  })

// The hours shown run from the first to the last one anyone works, so the table leaves out the night the
// store is closed
const getShownHours = (rows: TPresenceTable['rows']): number[] => {
  const worked = Array.from({ length: 24 }, (_, hour) => hour).filter((hour) =>
    rows.some(({ values }) => values[hour] > 0)
  )
  return worked.length === 0
    ? []
    : Array.from(
        { length: worked.at(-1)! - worked[0] + 1 },
        (_, index) => worked[0] + index
      )
}

const pickHours = (
  rows: TPresenceTable['rows'],
  hours: number[]
): TPresenceTable['rows'] =>
  rows.map(({ weekday, values }) => ({
    weekday,
    values: hours.map((hour) => values[hour])
  }))

const findUnmetRules = ({
  moves,
  breaks
}: {
  moves: TRestMove[]
  breaks: ReturnType<typeof findRestBreaks>
}): TUnmetRule[] => {
  const constraints = new Map<
    string,
    Extract<TUnmetRule, { kind: 'constraint' }>
  >()
  for (const { ruleName, target, unmetConstraints } of moves) {
    if (!target) continue
    for (const constraint of unmetConstraints) {
      const key = `${ruleName}|${constraint}`
      const unmet = constraints.get(key) ?? {
        kind: 'constraint' as const,
        ruleName,
        constraint,
        dates: []
      }
      unmet.dates.push(target)
      constraints.set(key, unmet)
    }
  }
  const restrictions = new Map<
    string,
    Extract<TUnmetRule, { kind: 'restriction' }>
  >()
  for (const { restriction, date } of breaks) {
    if (restriction.level !== 'preferred') continue
    const unmet = restrictions.get(restriction.id) ?? {
      kind: 'restriction' as const,
      restriction,
      dates: []
    }
    unmet.dates.push(date)
    restrictions.set(restriction.id, unmet)
  }
  return [...constraints.values(), ...restrictions.values()].map((unmet) => ({
    ...unmet,
    dates: [...new Set(unmet.dates)].toSorted((a, b) => a.localeCompare(b))
  }))
}

const findAttentionPoints = ({
  months,
  moves,
  breaks,
  groupRests,
  usersWithoutSchedule,
  names
}: {
  months: TReportMonthInput[]
  moves: TRestMove[]
  breaks: ReturnType<typeof findRestBreaks>
  groupRests: TWeekdayRests[]
  usersWithoutSchedule: TReportUser[]
  names: Map<string, string>
}): TAttentionPoint[] => {
  const requiredBreaks = new Map<
    string,
    Extract<TAttentionPoint, { kind: 'required-restriction-break' }>
  >()
  for (const { restriction, date } of breaks) {
    if (restriction.level !== 'required') continue
    requiredBreaks.set(`${restriction.id}|${date}`, {
      kind: 'required-restriction-break',
      restriction,
      date
    })
  }
  return [
    ...months
      .filter(({ upToDate }) => !upToDate)
      .map(({ month }) => ({ kind: 'outdated-month' as const, month })),
    ...moves
      .filter(({ target }) => target === null)
      .toSorted((a, b) => a.date.localeCompare(b.date))
      .map(({ userId, date, ruleName }) => ({
        kind: 'unmoved-rest' as const,
        userName: names.get(userId) ?? '',
        date,
        ruleName
      })),
    ...requiredBreaks
      .values()
      .toArray()
      .toSorted((a, b) => a.date.localeCompare(b.date)),
    ...groupRests
      .filter(({ members }) => members === 1)
      .map(({ name }) => ({
        kind: 'single-member-group' as const,
        groupName: name!
      })),
    ...usersWithoutSchedule.map(({ name }) => ({
      kind: 'without-schedule' as const,
      userName: name
    }))
  ]
}

export const buildScheduleReport = ({
  months,
  users,
  groups,
  rules,
  restrictions,
  isHoliday,
  limit
}: {
  months: TReportMonthInput[]
  users: TReportUser[]
  groups: TReportGroup[]
  rules: Pick<TRestRuleInput, 'windowStartDay' | 'windowEndDay'>[]
  restrictions: TRestRestrictionInput[]
  isHoliday: (date: string) => boolean
  limit: number | null
}): TScheduleReport => {
  const initialDate = months[0].initialDate
  const finalDate = months.at(-1)!.finalDate
  const dates = getDates(initialDate, finalDate)
  const all: TEmployeeDays[] = users
    .map((user) => {
      const planned = months.flatMap((month) =>
        month.users.filter(({ userId }) => userId === user.id)
      )
      return {
        user,
        baseDays: planned.flatMap(({ baseDays }) => baseDays),
        days: planned.flatMap(({ days }) => days)
      }
    })
    .toSorted((a, b) => compareNames(a.user.name, b.user.name))
  const employees = all.filter(({ days }) =>
    days.some(({ kind }) => kind !== 'unassigned')
  )
  const employeeIds = new Set(employees.map(({ user }) => user.id))
  const reportUsers = employees.map(({ user }) => user)
  const moves = months
    .flatMap((month) => month.moves)
    .filter(({ userId }) => employeeIds.has(userId))
  const offByDate = new Map<string, Set<string>>()
  for (const { user, days } of employees) {
    for (const day of days) {
      if (day.kind !== 'off') continue
      const off = offByDate.get(day.date) ?? new Set<string>()
      off.add(user.id)
      offByDate.set(day.date, off)
    }
  }
  const countOff = (date: string, userIds?: Set<string>): number => {
    const off = offByDate.get(date)
    if (!off) return 0
    if (!userIds) return off.size
    return [...off].filter((id) => userIds.has(id)).length
  }
  const reportGroups = groups
    .map((group) => ({
      group,
      name: getGroupLabel(groups, group.id),
      userIds: getGroupUserIds(groups, group.id, reportUsers)
    }))
    .filter(({ userIds }) => userIds.size > 0)
    .toSorted((a, b) => compareNames(a.name, b.name))
  const employeesOf = (userIds: Set<string>): TEmployeeDays[] =>
    employees.filter(({ user }) => userIds.has(user.id))
  const groupRests: TWeekdayRests[] = reportGroups.map(
    ({ group, name, userIds }) => ({
      groupId: group.id,
      name,
      members: userIds.size,
      weekdays: summarizeWeekdayRests(employeesOf(userIds), dates)
    })
  )
  const generalPresence = summarizePresence(
    countPresence(employees, dates, isHoliday)
  )
  const hours = getShownHours(generalPresence)
  const breaks = findRestBreaks({
    restrictions,
    users: employees.map(({ user, days }) => ({ userId: user.id, days }))
  })
  const shiftPatterns = new Map<string, number>()
  for (const { shiftPatternNames } of reportUsers) {
    for (const name of shiftPatternNames) {
      shiftPatterns.set(name, (shiftPatterns.get(name) ?? 0) + 1)
    }
  }
  return {
    initialDate,
    finalDate,
    limit,
    indicators: {
      employees: employees.length,
      movedRests: moves.filter(({ target }) => target !== null).length,
      unmovedRests: moves.filter(({ target }) => target === null).length,
      worstDay: findWorstDay(dates, (date) => countOff(date))
    },
    employees: employees.map((employee) =>
      summarizeEmployee(employee, { moves, groups, isHoliday })
    ),
    rests: [
      {
        groupId: null,
        name: null,
        members: employees.length,
        weekdays: summarizeWeekdayRests(employees, dates)
      },
      ...groupRests
    ],
    hours,
    presence: [
      { groupId: null, name: null, rows: pickHours(generalPresence, hours) },
      ...reportGroups.map(({ group, name, userIds }) => {
        const presence = countPresence(employeesOf(userIds), dates, isHoliday)
        return {
          groupId: group.id,
          name,
          rows: pickHours(summarizePresence(presence), hours)
        }
      })
    ],
    months: months.map(({ month, initialDate, finalDate, upToDate }) => {
      const monthDates = getDates(initialDate, finalDate)
      // A company without rest rules has no window, so the month has no average to show
      const windowDates = monthDates.filter((date) =>
        rules.some((rule) => isInWindow(rule, date))
      )
      return {
        month,
        total: monthDates.reduce((total, date) => total + countOff(date), 0),
        windowAverage:
          windowDates.length > 0
            ? roundAverage(
                windowDates.reduce((total, date) => total + countOff(date), 0) /
                  windowDates.length
              )
            : null,
        worstDay: findWorstDay(monthDates, (date) => countOff(date)),
        daysAboveLimit:
          limit === null
            ? null
            : monthDates.filter((date) => countOff(date) > limit).length,
        upToDate
      }
    }),
    groupWorstDays: reportGroups.map(({ group, name, userIds }) => ({
      groupId: group.id,
      name,
      members: userIds.size,
      worstDay: findWorstDay(dates, (date) => countOff(date, userIds))
    })),
    unmetRules: findUnmetRules({ moves, breaks }),
    attentionPoints: findAttentionPoints({
      months,
      moves,
      breaks,
      groupRests,
      usersWithoutSchedule: all
        .filter(({ user }) => !employeeIds.has(user.id))
        .map(({ user }) => user),
      names: new Map(users.map(({ id, name }) => [id, name]))
    }),
    shiftPatterns: [...shiftPatterns]
      .map(([name, employees]) => ({ name, employees }))
      .toSorted((a, b) => compareNames(a.name, b.name))
  }
}
