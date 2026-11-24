import type { TJustificationWithType } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { minutesToTime } from '@/models/schedule/utils'

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
  [justification.type.name, formatTimes(justification)]
    .filter(Boolean)
    .join(' ')

const getJustificationPeriodLabel = ({
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
    justification.type.name,
    getJustificationPeriodLabel(justification),
    formatTimes(justification)
  ]
    .filter(Boolean)
    .join(', ')
