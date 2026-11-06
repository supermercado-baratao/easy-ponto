import type { TPunchRecordPeriod } from '@/models/punch-record/types'

export const getPunchRecordsHref = ({
  pis,
  initialDate,
  finalDate
}: TPunchRecordPeriod & { pis: string }): string =>
  `/registros-de-ponto?${new URLSearchParams({ pis, inicio: initialDate, fim: finalDate })}`
