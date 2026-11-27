import type { TTimeField, TWeekdayKey } from '@/constants/time'

import type { TTimeCardReportFormat } from './types'

export const TIME_CARD_REPORT_FORMATS = ['secullum'] as const

export const DEFAULT_TIME_CARD_REPORT_FORMAT: TTimeCardReportFormat = 'secullum'

export const TIME_CARD_REPORT_FORMAT_LABELS: Record<
  TTimeCardReportFormat,
  string
> = {
  secullum: 'Secullum'
}

export type TWeekdayTimeFieldName = `${TWeekdayKey}${Capitalize<TTimeField>}`

export const getWeekdayTimeFieldName = (
  weekdayKey: TWeekdayKey,
  field: TTimeField
): TWeekdayTimeFieldName =>
  `${weekdayKey}${field.charAt(0).toUpperCase()}${field.slice(1)}` as TWeekdayTimeFieldName
