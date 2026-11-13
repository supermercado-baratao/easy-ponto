import type { HoursBankClosing } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { TJourneyDay } from '@/models/journey/types'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import type { THoursBankOrder, THoursBankRow, THoursBankTotals } from './types'

export const HOURS_BANK_ORDERS = ['balance', 'name'] as const

const DATE_FORMAT = 'YYYY-MM-DD'

export const sumJourneys = (
  days: TJourneyDay[]
): Omit<THoursBankTotals, 'adjustment'> => {
  const totals = {
    absence: 0,
    lateness: 0,
    dayOff: 0,
    overtime60: 0,
    overtime100: 0
  }
  for (const { journey } of days) {
    totals.absence += journey.absence
    totals.lateness += journey.lateness
    totals.dayOff += journey.dayOff
    totals.overtime60 += journey.overtime60
    totals.overtime100 += journey.overtime100
  }
  return totals
}

export const calculateBalance = ({
  previousBalance,
  absence,
  lateness,
  dayOff,
  overtime60,
  overtime100,
  adjustment
}: THoursBankTotals & { previousBalance: number }): number =>
  previousBalance +
  overtime60 +
  overtime100 +
  adjustment -
  absence -
  lateness -
  dayOff

export const sortRows = (
  rows: THoursBankRow[],
  order: THoursBankOrder
): THoursBankRow[] =>
  rows.toSorted((first, second) =>
    order === 'name' || first.balance === second.balance
      ? first.name.localeCompare(second.name)
      : second.balance - first.balance
  )

export const getNextStartDate = (
  lastClosing: Pick<HoursBankClosing, 'endDate'> | null
): string | null =>
  lastClosing
    ? dayjs(lastClosing.endDate).add(1, 'day').format(DATE_FORMAT)
    : null

export const findCloseIssue = ({
  period,
  lastClosing,
  today
}: {
  period: TPunchRecordPeriod
  lastClosing: Pick<HoursBankClosing, 'endDate'> | null
  today: string
}): string | null => {
  const nextStartDate = getNextStartDate(lastClosing)
  if (nextStartDate && period.initialDate !== nextStartDate) {
    return `O período deve começar em ${dayjs(nextStartDate).format('DD/MM/YYYY')}, o dia seguinte ao último fechamento.`
  }
  if (period.finalDate > today) {
    return 'O período só pode ser fechado até hoje.'
  }
  return null
}

export const isInClosedPeriod = (
  date: string,
  lastClosing: Pick<HoursBankClosing, 'endDate'> | null
): boolean => lastClosing !== null && date <= lastClosing.endDate
