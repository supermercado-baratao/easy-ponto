import { dayjs } from '@/infra/dayjs'
import { minutesToTime } from '@/infra/time'
import type { TScheduleReportPeriod } from '@/models/schedule-report/types'

import type { TReportVersion } from './types'

export const SCHEDULE_REPORT_PATH = '/relatorio-da-escala'

// The container scrolls the wide tables on screen, which would cut them on paper
export const PRINTED_TABLE_CONTAINER = { className: 'print:overflow-visible' }

const VERSION_PARAMS: Record<TReportVersion, string | null> = {
  full: null,
  management: 'gerencia'
}

export const getReportVersion = (parameter?: string): TReportVersion =>
  parameter === VERSION_PARAMS.management ? 'management' : 'full'

export const getReportHref = (
  { initialMonth, finalMonth, limit }: TScheduleReportPeriod,
  version: TReportVersion
): string => {
  const parameters = new URLSearchParams({ de: initialMonth, ate: finalMonth })
  if (limit !== null) parameters.set('limite', String(limit))
  const versionParameter = VERSION_PARAMS[version]
  if (versionParameter) parameters.set('versao', versionParameter)
  return `${SCHEDULE_REPORT_PATH}?${parameters}`
}

export const getVersionParameter = (version: TReportVersion): string | null =>
  VERSION_PARAMS[version]

export const formatDate = (date: string): string =>
  dayjs(date).format('ddd, DD/MM')

export const formatDates = (dates: string[]): string =>
  dates.map((date) => formatDate(date)).join(', ')

export const formatMonth = (month: string): string => {
  const label = dayjs(`${month}-01`).format('MMMM [de] YYYY')
  return label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1)
}

export const formatAverage = (value: number): string =>
  value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export const formatBalance = (minutes: number): string => {
  if (minutes === 0) return '00:00'
  return `${minutes > 0 ? '+' : '−'}${minutesToTime(Math.abs(minutes))}`
}

export const getGroupName = (name: string | null): string =>
  name === null ? 'Todos' : name

export const formatHour = (hour: number): string =>
  `${String(hour).padStart(2, '0')}h`
