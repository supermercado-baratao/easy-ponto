import type { TJustificationWithType } from '@/infra/database/types'
import { minutesToTime } from '@/models/schedule/utils'

import type { TJustificationFormValues } from './types'

export const getDayActionsId = (date: string): string => `day-actions-${date}`

export const getJustificationFormValues = (
  justification: TJustificationWithType
): TJustificationFormValues => ({
  id: justification.id,
  typeId: justification.typeId,
  startDate: justification.startDate,
  endDate: justification.endDate,
  startTime:
    justification.startTime === null
      ? ''
      : minutesToTime(justification.startTime),
  endTime:
    justification.endTime === null ? '' : minutesToTime(justification.endTime),
  note: justification.note ?? ''
})
