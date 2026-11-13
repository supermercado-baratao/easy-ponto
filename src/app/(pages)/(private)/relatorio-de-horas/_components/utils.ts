import { dayjs } from '@/infra/dayjs'
import type { THoursBankOrder } from '@/models/hours-bank/types'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'
import { minutesToTime } from '@/models/schedule/utils'

export const ORDER_PARAM: Record<THoursBankOrder, string> = {
  balance: 'saldo',
  name: 'nome'
}

export const getHoursReportHref = ({
  initialDate,
  finalDate,
  order
}: TPunchRecordPeriod & { order: THoursBankOrder }): string =>
  `/relatorio-de-horas?${new URLSearchParams({ inicio: initialDate, fim: finalDate, ordem: ORDER_PARAM[order] })}`

export const formatSignedMinutes = (minutes: number): string =>
  `${minutes < 0 ? '-' : ''}${minutesToTime(Math.abs(minutes))}`

export const formatDate = (date: string): string =>
  dayjs(date).format('DD/MM/YYYY')

export const formatPeriod = ({
  initialDate,
  finalDate
}: TPunchRecordPeriod): string =>
  `${formatDate(initialDate)} a ${formatDate(finalDate)}`

export const getRowActionsId = (userId: string): string =>
  `row-actions-${userId}`

export const getPunchRecordsHref = ({
  pis,
  initialDate,
  finalDate
}: TPunchRecordPeriod & { pis: string }): string =>
  `/registros-de-ponto?${new URLSearchParams({ pis, inicio: initialDate, fim: finalDate })}`
