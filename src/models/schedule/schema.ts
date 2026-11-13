import { z } from 'zod'

import type { ScheduleDay, TInputData } from '@/infra/database/types'

import {
  getTimeFieldName,
  TIME_FIELDS,
  TIME_PAIRS,
  timeToMinutes,
  type TScheduleTimeFieldName,
  type TWeekdayKey,
  WEEKDAYS
} from './utils'

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export const timeSchema = z
  .string()
  .refine((value) => value === '' || TIME_PATTERN.test(value), {
    message: 'Horário deve estar no formato hh:mm'
  })
  .default('')

const timeFieldsShape = Object.fromEntries(
  WEEKDAYS.flatMap(({ key }) =>
    TIME_FIELDS.map((field) => [getTimeFieldName(key, field), timeSchema])
  )
) as Record<TScheduleTimeFieldName, typeof timeSchema>

const toMinutes = (time: string): number | null =>
  time === '' ? null : timeToMinutes(time)

type TDayIssue = { path: [TScheduleTimeFieldName]; message: string }

const findDayIssue = (
  times: Record<TScheduleTimeFieldName, string>,
  weekdayKey: TWeekdayKey
): TDayIssue | undefined => {
  let isPreviousPairFilled = true
  let previousTime: number | undefined

  for (const pair of TIME_PAIRS) {
    const entry = getTimeFieldName(weekdayKey, pair.entry)
    const exit = getTimeFieldName(weekdayKey, pair.exit)
    const isFilled = times[entry] !== '' || times[exit] !== ''
    if (!isFilled) {
      isPreviousPairFilled = false
      continue
    }

    if (!isPreviousPairFilled) {
      return {
        path: [entry],
        message: 'Preencha os horários anteriores primeiro'
      }
    }
    if (times[entry] === '')
      return { path: [entry], message: 'Informe a entrada' }
    if (times[exit] === '') return { path: [exit], message: 'Informe a saída' }

    for (const name of [entry, exit]) {
      const minutes = timeToMinutes(times[name])
      if (previousTime !== undefined && minutes <= previousTime) {
        return { path: [name], message: 'Horário deve ser depois do anterior' }
      }
      previousTime = minutes
    }
  }
}

export const saveSchema = z
  .object({
    companyId: z.uuidv4(),
    userId: z.uuidv4(),
    startDate: z.iso.date(),
    ...timeFieldsShape
  })
  .superRefine((data, context) => {
    for (const { key } of WEEKDAYS) {
      const issue = findDayIssue(data, key)
      if (issue) context.addIssue({ code: 'custom', ...issue })
    }
  })
  .transform(({ companyId, userId, startDate, ...times }) => ({
    companyId,
    userId,
    startDate,
    days: WEEKDAYS.map(({ key, weekday }) => ({
      weekday,
      ...Object.fromEntries(
        TIME_FIELDS.map((field) => [
          field,
          toMinutes(times[getTimeFieldName(key, field)])
        ])
      )
    })) as Omit<TInputData<ScheduleDay>, 'scheduleId'>[]
  }))

export const findInEffectParamsSchema = z.object({
  userId: z.uuidv4(),
  date: z.iso.date()
})

export const findManyInPeriodParamsSchema = z.object({
  userId: z.uuidv4(),
  initialDate: z.iso.date(),
  finalDate: z.iso.date()
})
