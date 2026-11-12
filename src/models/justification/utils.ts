import type { Justification } from '@/infra/database/types'

type TJustificationPeriod = Pick<
  Justification,
  'startDate' | 'endDate' | 'startTime' | 'endTime'
>

const overlapsInTime = (
  justification: TJustificationPeriod,
  other: TJustificationPeriod
): boolean =>
  justification.startTime === null ||
  justification.endTime === null ||
  other.startTime === null ||
  other.endTime === null ||
  (justification.startTime < other.endTime &&
    other.startTime < justification.endTime)

export const findOverlappingJustification = <T extends TJustificationPeriod>(
  justification: TJustificationPeriod,
  justifications: T[]
): T | undefined =>
  justifications.find(
    (other) =>
      other.startDate <= justification.endDate &&
      justification.startDate <= other.endDate &&
      overlapsInTime(justification, other)
  )

export const coversDate = (
  { startDate, endDate }: Pick<Justification, 'startDate' | 'endDate'>,
  date: string
): boolean => startDate <= date && date <= endDate
