import type { TScheduleWithDays } from '@/infra/database/types'
import {
  getTimeFieldName,
  minutesToTime,
  TIME_FIELDS,
  type TScheduleTimeField,
  type TWeekdayKey,
  WEEKDAYS
} from '@/models/schedule/utils'

import type { TScheduleFormValues } from './types'

export const WEEKDAY_LABELS: Record<TWeekdayKey, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

export const TIME_FIELD_LABELS: Record<TScheduleTimeField, string> = {
  entry1: 'Entrada 1',
  exit1: 'Saída 1',
  entry2: 'Entrada 2',
  exit2: 'Saída 2',
  entry3: 'Entrada 3',
  exit3: 'Saída 3'
}

export const formatMinutes = (minutes: number | null): string =>
  minutes === null ? '' : minutesToTime(minutes)

export const getScheduleFormValues = (
  schedule: TScheduleWithDays | null,
  defaultStartDate: string
): TScheduleFormValues =>
  Object.fromEntries([
    ['startDate', schedule?.startDate ?? defaultStartDate],
    ...WEEKDAYS.flatMap(({ key, weekday }) => {
      const day = schedule?.days.find((day) => day.weekday === weekday)
      return TIME_FIELDS.map((field) => [
        getTimeFieldName(key, field),
        formatMinutes(day?.[field] ?? null)
      ])
    })
  ])
