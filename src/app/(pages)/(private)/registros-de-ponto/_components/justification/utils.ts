import type { TJustificationWithType } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { minutesToTime } from '@/models/schedule/utils'

import type { TJustificationFormValues } from './types'

export const getDayActionsId = (date: string): string => `day-actions-${date}`

const formatTimes = ({
  startTime,
  endTime
}: Pick<TJustificationWithType, 'startTime' | 'endTime'>): string | null =>
  startTime === null || endTime === null
    ? null
    : `${minutesToTime(startTime)}–${minutesToTime(endTime)}`

export const getJustificationShortLabel = (
  justification: TJustificationWithType
): string =>
  [justification.type.code, formatTimes(justification)]
    .filter(Boolean)
    .join(' ')

export const getJustificationPeriodLabel = ({
  startDate,
  endDate
}: Pick<TJustificationWithType, 'startDate' | 'endDate'>): string =>
  startDate === endDate
    ? dayjs(startDate).format('DD/MM/YYYY')
    : `${dayjs(startDate).format('DD/MM/YYYY')} a ${dayjs(endDate).format('DD/MM/YYYY')}`

export const getJustificationLabel = (
  justification: TJustificationWithType
): string =>
  [
    `${justification.type.code} – ${justification.type.description}`,
    getJustificationPeriodLabel(justification),
    formatTimes(justification)
  ]
    .filter(Boolean)
    .join(', ')

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
