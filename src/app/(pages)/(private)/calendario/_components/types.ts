import type { TUsersFilterValues } from '@/app/components/blocks/users-filter'
import type { ShiftAssignment, User } from '@/infra/database/types'
import type {
  TCalendarSummary,
  TCalendarUserSummary,
  TCalendarWeek
} from '@/models/workload-calendar/types'

export type TCalendarRow = {
  user: User
  summary: TCalendarUserSummary
}

export type TCalendarAssignmentOption = Pick<
  ShiftAssignment,
  'id' | 'startDate' | 'endDate'
> & { name: string }

export type TCalendarUserMonthView = {
  user: User
  weeks: TCalendarWeek[]
  summary: TCalendarSummary
  assignments: TCalendarAssignmentOption[]
}

export type TCalendarFilters = TUsersFilterValues & { userId: string | null }
