import { TIME_FIELDS } from '@/constants/time'
import { formatCycleTime } from '@/models/shift-pattern/utils'
import type { TCalendarDay } from '@/models/workload-calendar/types'

import type { TCalendarAssignmentOption } from '../types'
import type { TDayFormValues } from './types'

export const DAY_CHOICES = ['schedule', 'work', 'off', 'custom'] as const

export type TDayChoice = (typeof DAY_CHOICES)[number]

export const isDayChoice = (
  value: string | null | undefined
): value is TDayChoice => DAY_CHOICES.includes(value as TDayChoice)

export const DAY_CHOICE_LABELS: Record<TDayChoice, string> = {
  schedule: 'Seguir a escala',
  work: 'Trabalho',
  off: 'Folga',
  custom: 'Outra carga'
}

export const DAY_CHOICE_DESCRIPTIONS: Record<TDayChoice, string> = {
  schedule: 'O dia volta a seguir a escala do funcionário.',
  work: 'Um dia de folga vira dia de trabalho, com o horário mais comum da escala.',
  off: 'O dia vira folga, sem carga.',
  custom:
    'O dia tem os horários informados abaixo, com até 3 pares de entrada e saída.'
}

export const getAssignmentsInEffect = (
  assignments: TCalendarAssignmentOption[],
  date: string
): TCalendarAssignmentOption[] =>
  assignments.filter(
    ({ startDate, endDate }) =>
      startDate <= date && (endDate === null || date <= endDate)
  )

const getScheduledTime = (
  pairs: TCalendarDay['pairs'],
  index: number
): number | null => {
  const pair = pairs.at(Math.floor(index / 2))
  if (!pair) return null
  return index % 2 === 0 ? pair.entry : pair.exit
}

export const getDayFormValues = (
  userId: string,
  { date, pairs, adjustment }: TCalendarDay
): TDayFormValues => {
  const times = adjustment?.kind === 'custom' ? adjustment : null
  return {
    userId,
    date,
    adjustmentId: adjustment?.id ?? '',
    kind: adjustment?.kind ?? 'schedule',
    shiftAssignmentId: adjustment?.shiftAssignmentId ?? '',
    ...Object.fromEntries(
      TIME_FIELDS.map((field, index) => [
        field,
        formatCycleTime(times ? times[field] : getScheduledTime(pairs, index))
      ])
    )
  }
}
