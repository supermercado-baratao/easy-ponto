import type {
  TShiftAssignmentWithPattern,
  TShiftPatternWithVersions,
  User
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import {
  getTimeFieldName,
  TIME_FIELDS,
  WEEKDAYS
} from '@/models/schedule/utils'
import {
  getCycleDay,
  getUsualWorkday,
  isInEffect
} from '@/models/shift-assignment/utils'
import { createSchema as shiftPatternCreateSchema } from '@/models/shift-pattern/schema'
import {
  formatCycleTime,
  getDayTimeFieldName,
  getDayTimes,
  isDayOff,
  isSameShiftPatternName,
  selectVersionInEffect,
  type TCycleDay
} from '@/models/shift-pattern/utils'
import type { TReportSchedule } from '@/models/time-card-report/types'
import type { TShiftPatternVersionData } from '@/repositories/shift-pattern-repository'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const WEEK_LENGTH = WEEKDAYS.length

export type TImportedShiftPattern = {
  key: string
  name: string
  version: TShiftPatternVersionData
}

export type TImportedShiftAssignment = {
  userId: string
  startDate: string
  cycleStartDay: number
} & ({ shiftPatternId: string } | { shiftPatternKey: string })

const getDaysKey = (days: TCycleDay[]): string =>
  JSON.stringify(
    days
      .toSorted((a, b) => a.cycleDay - b.cycleDay)
      .map((day) => getDayTimes(day))
  )

// The report prints the week from Monday, so the cycle starts on Monday and day N is a weekday
export const getWeekCycleDay = (date: string): number =>
  WEEKDAYS.findIndex(({ weekday }) => weekday === dayjs(date).day()) + 1

const toVersion = (
  companyId: string,
  schedule: TReportSchedule
): TShiftPatternVersionData | null => {
  const times = Object.fromEntries(
    WEEKDAYS.flatMap(({ key }, index) =>
      TIME_FIELDS.map((field) => [
        getDayTimeFieldName(index + 1, field),
        schedule[getTimeFieldName(key, field)] ?? ''
      ])
    )
  )
  if (Object.values(times).every((time) => time === '')) return null
  const { version } = shiftPatternCreateSchema.parse({
    companyId,
    name: 'Horário importado',
    startDate: schedule.startDate,
    cycleLength: WEEK_LENGTH,
    ...times
  })
  return version
}

const getWeekdaysLabel = (days: TCycleDay[]): string => {
  const workdays = days
    .filter((day) => !isDayOff(day))
    .map((day) => day.cycleDay)
  const groups: number[][] = []
  for (const cycleDay of workdays) {
    const group = groups.at(-1)
    if (group && group.at(-1) === cycleDay - 1) group.push(cycleDay)
    else groups.push([cycleDay])
  }
  return groups
    .map((group) =>
      group.length > 2
        ? `${WEEKDAY_LABELS[group[0] - 1]} a ${WEEKDAY_LABELS[group.at(-1)! - 1]}`
        : group.map((cycleDay) => WEEKDAY_LABELS[cycleDay - 1]).join(', ')
    )
    .join(', ')
}

const getName = (days: TCycleDay[], takenNames: string[]): string => {
  const times = getDayTimes(getUsualWorkday({ days })!)
  const baseName = `${getWeekdaysLabel(days)} ${formatCycleTime(times[0])}–${formatCycleTime(times.at(-1)!)}`
  let name = baseName
  for (
    let suffix = 2;
    takenNames.some((taken) => isSameShiftPatternName(taken, name));
    suffix++
  ) {
    name = `${baseName} (${suffix})`
  }
  return name
}

const findSavedPattern = (
  savedPatterns: TShiftPatternWithVersions[],
  key: string,
  startDate: string
): TShiftPatternWithVersions | undefined =>
  savedPatterns.find((shiftPattern) => {
    const version = selectVersionInEffect(shiftPattern.versions, startDate)
    return (
      version?.cycleLength === WEEK_LENGTH && getDaysKey(version.days) === key
    )
  })

const isAlreadyAssigned = (
  assignments: TShiftAssignmentWithPattern[],
  shiftPatternId: string,
  startDate: string
): boolean => {
  const inEffect = assignments.filter((assignment) =>
    isInEffect(assignment, startDate)
  )
  const [assignment] = inEffect
  return (
    inEffect.length === 1 &&
    assignment.shiftPatternId === shiftPatternId &&
    assignment.endDate === null &&
    getCycleDay(assignment, WEEK_LENGTH, startDate) ===
      getWeekCycleDay(startDate) &&
    assignments.every((other) => other.startDate <= startDate)
  )
}

// Employees with the same weekly schedule share one pattern, which the company may rename
export const getShiftPatternsToImport = ({
  companyId,
  reportSchedules,
  users,
  savedPatterns,
  savedAssignments
}: {
  companyId: string
  reportSchedules: TReportSchedule[]
  users: User[]
  savedPatterns: TShiftPatternWithVersions[]
  savedAssignments: TShiftAssignmentWithPattern[]
}): {
  shiftPatterns: TImportedShiftPattern[]
  shiftAssignments: TImportedShiftAssignment[]
} => {
  const shiftPatterns: TImportedShiftPattern[] = []
  const shiftAssignments: TImportedShiftAssignment[] = []
  const takenNames = savedPatterns.map(({ name }) => name)

  for (const schedule of reportSchedules) {
    const user = users.find(({ name }) => name === schedule.userName)
    if (!user) continue
    const version = toVersion(companyId, schedule)
    if (!version) continue

    const { startDate } = version
    const key = getDaysKey(version.days)
    const cycleStartDay = getWeekCycleDay(startDate)
    const savedPattern = findSavedPattern(savedPatterns, key, startDate)
    if (savedPattern) {
      const userAssignments = savedAssignments.filter(
        ({ userId }) => userId === user.id
      )
      if (!isAlreadyAssigned(userAssignments, savedPattern.id, startDate)) {
        shiftAssignments.push({
          userId: user.id,
          startDate,
          cycleStartDay,
          shiftPatternId: savedPattern.id
        })
      }
      continue
    }

    if (shiftPatterns.every((shiftPattern) => shiftPattern.key !== key)) {
      const name = getName(version.days, takenNames)
      takenNames.push(name)
      shiftPatterns.push({ key, name, version })
    }
    shiftAssignments.push({
      userId: user.id,
      startDate,
      cycleStartDay,
      shiftPatternKey: key
    })
  }

  return { shiftPatterns, shiftAssignments }
}
