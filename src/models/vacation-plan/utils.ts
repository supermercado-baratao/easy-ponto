import type { VacationPlan } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

import type { TVacationMonth, TVacationPlanRow } from './types'

export const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

export const getMonthPeriod = (
  year: number,
  month: number
): { startDate: string; endDate: string } => {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  return {
    startDate: start.format('YYYY-MM-DD'),
    endDate: start.endOf('month').format('YYYY-MM-DD')
  }
}

export const groupByMonth = (rows: TVacationPlanRow[]): TVacationMonth[] =>
  MONTHS.map((month) => ({
    month,
    users: rows.flatMap(({ user, plan }) =>
      plan?.month === month ? [user] : []
    )
  }))

export const canChangeMonth = (
  plan: Pick<VacationPlan, 'month' | 'justificationId'> | null,
  month: number | null
): boolean => !plan?.justificationId || plan.month === month
