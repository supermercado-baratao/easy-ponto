import { z } from 'zod'

import { timeSchema } from '@/models/schedule/schema'
import { TIME_PAIRS, timeToMinutes } from '@/models/schedule/utils'

import {
  CYCLE_DAYS,
  getDayTimeFieldName,
  getDayTimes,
  isDayOff,
  MAX_CYCLE_LENGTH,
  MIN_CYCLE_LENGTH,
  MINUTES_PER_DAY,
  type TCycleDay,
  type TShiftPatternTimeFieldName
} from './utils'

const timeFieldsShape = Object.fromEntries(
  CYCLE_DAYS.flatMap((cycleDay) =>
    TIME_PAIRS.flatMap(({ entry, exit }) => [
      [getDayTimeFieldName(cycleDay, entry), timeSchema],
      [getDayTimeFieldName(cycleDay, exit), timeSchema]
    ])
  )
) as Record<TShiftPatternTimeFieldName, typeof timeSchema>

const versionShape = {
  startDate: z.iso.date({ error: 'Informe a data' }),
  cycleLength: z.coerce
    .number({ error: 'Informe os dias do ciclo' })
    .int('Informe um número inteiro de dias')
    .min(
      MIN_CYCLE_LENGTH,
      `O ciclo deve ter pelo menos ${MIN_CYCLE_LENGTH} dia`
    )
    .max(
      MAX_CYCLE_LENGTH,
      `O ciclo deve ter no máximo ${MAX_CYCLE_LENGTH} dias`
    ),
  ...timeFieldsShape
}

type TCycleTimes = { cycleLength: number } & Record<
  TShiftPatternTimeFieldName,
  string
>

type TCycleIssue = { path: [TShiftPatternTimeFieldName]; message: string }

type TParsedDay = { day: TCycleDay } | { issue: TCycleIssue }

const parseDay = (times: TCycleTimes, cycleDay: number): TParsedDay => {
  const day: TCycleDay = {
    cycleDay,
    entry1: null,
    exit1: null,
    entry2: null,
    exit2: null,
    entry3: null,
    exit3: null
  }
  let isPreviousPairFilled = true
  let firstTime: number | undefined
  let previousTime: number | undefined
  let offset = 0

  for (const pair of TIME_PAIRS) {
    const entry = getDayTimeFieldName(cycleDay, pair.entry)
    const exit = getDayTimeFieldName(cycleDay, pair.exit)
    if (times[entry] === '' && times[exit] === '') {
      isPreviousPairFilled = false
      continue
    }

    if (!isPreviousPairFilled) {
      return {
        issue: {
          path: [entry],
          message: 'Preencha os horários anteriores primeiro'
        }
      }
    }
    if (times[entry] === '')
      return { issue: { path: [entry], message: 'Informe a entrada' } }
    if (times[exit] === '')
      return { issue: { path: [exit], message: 'Informe a saída' } }

    for (const [name, field] of [
      [entry, pair.entry],
      [exit, pair.exit]
    ] as const) {
      let minutes = timeToMinutes(times[name]) + offset
      if (previousTime !== undefined && minutes <= previousTime) {
        if (minutes === previousTime || offset > 0) {
          return {
            issue: {
              path: [name],
              message: 'Horário deve ser depois do anterior'
            }
          }
        }
        offset = MINUTES_PER_DAY
        minutes += MINUTES_PER_DAY
      }
      firstTime ??= minutes
      if (minutes - firstTime >= MINUTES_PER_DAY) {
        return {
          issue: {
            path: [name],
            message: 'A jornada do dia deve durar menos de 24 horas'
          }
        }
      }
      previousTime = minutes
      day[field] = minutes
    }
  }

  return { day }
}

const parseCycle = (
  times: TCycleTimes
): { days: TCycleDay[]; issues: TCycleIssue[] } => {
  const days: TCycleDay[] = []
  const issues: TCycleIssue[] = []
  for (const cycleDay of CYCLE_DAYS.slice(0, times.cycleLength)) {
    const parsed = parseDay(times, cycleDay)
    if ('issue' in parsed) issues.push(parsed.issue)
    else days.push(parsed.day)
  }
  if (issues.length > 0) return { days, issues }

  if (days.every(isDayOff)) {
    issues.push({
      path: [getDayTimeFieldName(1, 'entry1')],
      message: 'Informe os horários de pelo menos um dia de trabalho'
    })
  }

  for (const [index, day] of days.entries()) {
    const lastTime = getDayTimes(day).at(-1)
    if (lastTime === undefined || lastTime <= MINUTES_PER_DAY) continue
    const nextDay = days[(index + 1) % days.length]
    if (
      nextDay.entry1 !== null &&
      nextDay.entry1 + MINUTES_PER_DAY < lastTime
    ) {
      issues.push({
        path: [getDayTimeFieldName(nextDay.cycleDay, 'entry1')],
        message: 'A entrada deve ser depois da última saída do dia anterior'
      })
    }
  }

  return { days, issues }
}

const refineCycle = (times: TCycleTimes, context: z.RefinementCtx): void => {
  if (!versionShape.cycleLength.safeParse(times.cycleLength).success) return
  for (const issue of parseCycle(times).issues)
    context.addIssue({ code: 'custom', ...issue })
}

const toVersion = ({
  startDate,
  ...times
}: TCycleTimes & {
  startDate: string
}): { startDate: string; cycleLength: number; days: TCycleDay[] } => ({
  startDate,
  cycleLength: times.cycleLength,
  days: parseCycle(times).days
})

const nameSchema = z.string().trim().min(1, 'Informe o nome')

export const createSchema = z
  .object({ companyId: z.uuidv4(), name: nameSchema, ...versionShape })
  .superRefine(refineCycle)
  .transform(({ companyId, name, ...version }) => ({
    companyId,
    name,
    version: toVersion(version)
  }))

export const updateSchema = z
  .object({
    id: z.uuidv4(),
    versionId: z.uuidv4().optional(),
    companyId: z.uuidv4(),
    name: nameSchema,
    ...versionShape
  })
  .superRefine(refineCycle)
  .transform(({ id, versionId, companyId, name, ...version }) => ({
    id,
    companyId,
    name,
    version: { id: versionId, ...toVersion(version) }
  }))

export const removeSchema = z.object({
  id: z.uuidv4(),
  companyId: z.uuidv4()
})

export const findManyByCompanyIdSchema = z.uuidv4()
