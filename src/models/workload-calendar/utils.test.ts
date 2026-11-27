import { describe, expect, test } from 'vitest'

import type { ShiftAdjustment } from '@/infra/database/types'
import type { TResolvedDay } from '@/models/shift-assignment/utils'

import {
  buildCalendarDays,
  buildCalendarWeeks,
  getMonthPeriod,
  summarizeCalendarDays
} from './utils'

const MORNING = [
  { entry: 480, exit: 720 },
  { entry: 840, exit: 1044 }
]

const workday = (date: string, adjusted = false): TResolvedDay => ({
  date,
  kind: 'work',
  pairs: MORNING,
  adjusted
})

const dayOff = (date: string, adjusted = false): TResolvedDay => ({
  date,
  kind: 'off',
  pairs: [],
  adjusted
})

const adjustment = (date: string): ShiftAdjustment => ({
  id: crypto.randomUUID(),
  date,
  kind: 'off',
  entry1: null,
  exit1: null,
  entry2: null,
  exit2: null,
  entry3: null,
  exit3: null,
  userId: crypto.randomUUID(),
  shiftAssignmentId: null,
  origin: 'manual',
  createdAt: new Date(),
  updatedAt: new Date()
})

describe('getMonthPeriod', () => {
  test('Returns the first and last days of the month', () => {
    expect(getMonthPeriod('2028-02')).toEqual({
      initialDate: '2028-02-01',
      finalDate: '2028-02-29'
    })
  })
})

describe('buildCalendarDays', () => {
  test('Takes the load of a workday from its pairs', () => {
    const [day] = buildCalendarDays({
      days: [workday('2035-08-01')],
      holidays: [],
      adjustments: []
    })

    expect(day).toMatchObject({
      day: 1,
      kind: 'work',
      workload: 444,
      holidayName: null,
      adjustment: null
    })
  })

  test('Keeps the schedule of a holiday without its load', () => {
    const [day] = buildCalendarDays({
      days: [workday('2035-08-15')],
      holidays: [{ dateInYear: '2035-08-15', name: 'Feriado da cidade' }],
      adjustments: []
    })

    expect(day).toMatchObject({
      kind: 'work',
      pairs: MORNING,
      workload: 0,
      holidayName: 'Feriado da cidade'
    })
  })

  test('Links each adjusted day to the adjustment of its date', () => {
    const saved = adjustment('2035-08-02')
    const days = buildCalendarDays({
      days: [dayOff('2035-08-01'), dayOff('2035-08-02', true)],
      holidays: [],
      adjustments: [saved]
    })

    expect(days.map(({ adjustment }) => adjustment)).toEqual([null, saved])
  })
})

describe('buildCalendarWeeks', () => {
  test('Leaves the days of the first and last weeks outside the month empty', () => {
    const { initialDate } = getMonthPeriod('2035-08')
    const days = buildCalendarDays({
      days: Array.from({ length: 31 }, (_, index) =>
        dayOff(`2035-08-${String(index + 1).padStart(2, '0')}`)
      ),
      holidays: [],
      adjustments: []
    })
    const weeks = buildCalendarWeeks(days)

    expect(weeks).toHaveLength(5)
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null])
    expect(weeks[0][3]?.date).toBe(initialDate)
    expect(weeks.at(-1)!.map((day) => day?.day ?? null)).toEqual([
      26,
      27,
      28,
      29,
      30,
      31,
      null
    ])
  })
})

describe('summarizeCalendarDays', () => {
  test('Counts the workdays, days off, holidays and adjustments apart', () => {
    const days = buildCalendarDays({
      days: [
        workday('2035-08-13'),
        workday('2035-08-14', true),
        workday('2035-08-15'),
        dayOff('2035-08-16'),
        dayOff('2035-08-17', true),
        { date: '2035-08-18', kind: 'unassigned', pairs: [], adjusted: false }
      ],
      holidays: [{ dateInYear: '2035-08-15', name: 'Feriado da cidade' }],
      adjustments: []
    })

    expect(summarizeCalendarDays(days)).toEqual({
      workdays: 2,
      daysOff: 2,
      holidays: 1,
      adjustments: 2,
      workload: 2 * 444
    })
  })
})
