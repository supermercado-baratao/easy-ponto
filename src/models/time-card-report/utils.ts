import type { TTimeCardReportFormat } from './types'

export const TIME_CARD_REPORT_FORMATS = ['secullum'] as const

export const DEFAULT_TIME_CARD_REPORT_FORMAT: TTimeCardReportFormat = 'secullum'

export const TIME_CARD_REPORT_FORMAT_LABELS: Record<
  TTimeCardReportFormat,
  string
> = {
  secullum: 'Secullum'
}
