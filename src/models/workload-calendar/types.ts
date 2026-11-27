import { z } from 'zod'

import type {
  ShiftAdjustment,
  TShiftAssignmentWithPattern,
  User
} from '@/infra/database/types'
import type { TResolvedDay } from '@/models/shift-assignment/utils'

import { findMonthSchema } from './schema'

export type TWorkloadCalendarFindMonthParams = z.input<typeof findMonthSchema>

export type TCalendarDay = Pick<
  TResolvedDay,
  'date' | 'kind' | 'pairs' | 'adjusted'
> & {
  day: number
  workload: number
  holidayName: string | null
  adjustment: ShiftAdjustment | null
}

export type TCalendarWeek = (TCalendarDay | null)[]

export type TCalendarSummary = {
  workdays: number
  daysOff: number
  holidays: number
  adjustments: number
  workload: number
}

export type TCalendarUserSummary = TCalendarSummary & {
  userId: string
  shiftPatternNames: string[]
}

export type TCalendarUserMonth = {
  user: User
  weeks: TCalendarWeek[]
  summary: TCalendarSummary
  assignments: TShiftAssignmentWithPattern[]
}

export type TCalendarMonth = {
  month: string
  users: User[]
  summaries: TCalendarUserSummary[]
  selected: TCalendarUserMonth | null
}
