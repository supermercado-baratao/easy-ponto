import type { TScheduleWithDays } from '@/infra/database/types'
import {
  getTimeFieldName,
  minutesToTime,
  TIME_FIELDS,
  WEEKDAYS
} from '@/models/schedule/utils'

import type { TScheduleFormValues } from './types'

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
