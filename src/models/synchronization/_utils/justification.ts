import { dayjs } from '@/infra/dayjs'
import { getTimeFieldName, TIME_PAIRS, WEEKDAYS } from '@/models/schedule/utils'

import { InvalidExcelFileError } from '../errors'
import type { TJustificationInJson, TScheduleInJson } from '../types'

// `Folga` is the weekly rest of the schedule and `Feriado` a holiday of the calendar, which
// Easy Ponto already derives from the schedules and the holidays. `Falta` is an unjustified
// absence. `FOLGA`, in uppercase, is a day off deducted from the hours bank, so the match is
// case-sensitive
const IGNORED_CODES = new Set(['Folga', 'Feriado', 'Falta'])

const DAY_ROW_PATTERN = /^(\d{2})\/(\d{2})\/(\d{2}) - \S+$/

const PAIR_COLUMNS = [
  { entry: 'Ent. 1', exit: 'Saí. 1' },
  { entry: 'Ent. 2', exit: 'Saí. 2' },
  { entry: 'Ent. 3', exit: 'Saí. 3' }
] as const

const CODE_PATTERN = /^\p{L}/u

type TDayJustification = Omit<TJustificationInJson, 'endDate'>

type TScheduledPair = { startTime: string; endTime: string } | null

const mapColumns = (header: Record<string, unknown>): Map<string, string> =>
  new Map(
    Object.entries(header).map(([key, label]) => [String(label).trim(), key])
  )

const toCode = (value: unknown): string | null => {
  const code = typeof value === 'string' ? value.trim() : ''
  return CODE_PATTERN.test(code) && !IGNORED_CODES.has(code) ? code : null
}

const getScheduledPairs = (
  schedule: TScheduleInJson | undefined,
  date: string
): TScheduledPair[] => {
  const weekday = dayjs(date).day()
  const { key } = WEEKDAYS.find((day) => day.weekday === weekday)!
  return TIME_PAIRS.map(({ entry, exit }) => {
    const startTime = schedule?.[getTimeFieldName(key, entry)] ?? ''
    const endTime = schedule?.[getTimeFieldName(key, exit)] ?? ''
    return startTime && endTime ? { startTime, endTime } : null
  })
}

// Secullum writes a justification code in the cells of the pairs it covers, so the day's
// schedule tells a whole day from a shift (#62)
const extractDayJustifications = ({
  userName,
  date,
  row,
  columns,
  schedule
}: {
  userName: string
  date: string
  row: Record<string, unknown>
  columns: Map<string, string>
  schedule: TScheduleInJson | undefined
}): TDayJustification[] => {
  const pairsByCode = new Map<string, number[]>()
  for (const [index, pair] of PAIR_COLUMNS.entries()) {
    const code =
      toCode(row[columns.get(pair.entry) ?? '']) ??
      toCode(row[columns.get(pair.exit) ?? ''])
    if (code) pairsByCode.set(code, [...(pairsByCode.get(code) ?? []), index])
  }

  const scheduledPairs = getScheduledPairs(schedule, date)
  const scheduledIndexes = scheduledPairs.flatMap((pair, index) =>
    pair ? [index] : []
  )
  const justifications: TDayJustification[] = []

  for (const [code, indexes] of pairsByCode) {
    const dayJustification = {
      userName,
      code,
      startDate: date,
      startTime: '',
      endTime: ''
    }
    const coversWholeDay = scheduledIndexes.every((index) =>
      indexes.includes(index)
    )
    const shifts = indexes.map((index) => scheduledPairs[index])
    if (coversWholeDay || shifts.some((shift) => !shift)) {
      justifications.push(dayJustification)
      continue
    }
    for (const shift of shifts as NonNullable<TScheduledPair>[]) {
      justifications.push({ ...dayJustification, ...shift })
    }
  }

  return justifications
}

const isWholeDay = ({ startTime }: TDayJustification): boolean =>
  startTime === ''

const mergeConsecutiveDays = (
  justifications: TDayJustification[]
): TJustificationInJson[] => {
  const merged: TJustificationInJson[] = []
  for (const justification of justifications) {
    const previous = merged.findLast(
      (other) =>
        other.userName === justification.userName &&
        other.code === justification.code &&
        isWholeDay(other)
    )
    if (
      previous &&
      isWholeDay(justification) &&
      dayjs(previous.endDate).add(1, 'day').format('YYYY-MM-DD') ===
        justification.startDate
    ) {
      previous.endDate = justification.startDate
      continue
    }
    merged.push({ ...justification, endDate: justification.startDate })
  }
  return merged
}

export const extractJustificationsFromJson = (
  json: any[],
  schedules: TScheduleInJson[]
): TJustificationInJson[] => {
  try {
    const justifications: TDayJustification[] = []
    let employeeName: string | undefined
    let columns = new Map<string, string>()

    for (const [index, row] of json.entries()) {
      if (row['CARTÃO PONTO'] === 'Departamento') {
        employeeName = json[index - 4]['__EMPTY']
        columns = mapColumns(json[index + 1])
        continue
      }
      const [, day, month, year] =
        DAY_ROW_PATTERN.exec(String(row['CARTÃO PONTO'])) ?? []
      if (!employeeName || !day) continue

      justifications.push(
        ...extractDayJustifications({
          userName: employeeName,
          date: `${Number(year) + 2000}-${month}-${day}`,
          row,
          columns,
          schedule: schedules.find(
            (schedule) => schedule.userName === employeeName
          )
        })
      )
    }

    return mergeConsecutiveDays(justifications)
  } catch (error) {
    throw new InvalidExcelFileError(error as Error)
  }
}
