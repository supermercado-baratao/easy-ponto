import { TIME_FIELDS } from '@/models/schedule/utils'
import {
  formatCycleTime,
  getDayTimeFieldName,
  type TCycleDayTimes
} from '@/models/shift-pattern/utils'

import type { TShiftPatternFormValues } from './types'

export const getDayFormValues = (
  days: TCycleDayTimes[]
): TShiftPatternFormValues =>
  Object.fromEntries(
    days.flatMap((day, index) =>
      TIME_FIELDS.map((field) => [
        getDayTimeFieldName(index + 1, field),
        formatCycleTime(day[field])
      ])
    )
  )
