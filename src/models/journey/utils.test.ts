import { describe, expect, test } from 'vitest'

import type {
  Holiday,
  PunchRecord,
  ScheduleDay,
  TJustificationWithType,
  TScheduleWithDays
} from '@/infra/database/types'
import { timeToMinutes } from '@/models/schedule/utils'

import type { TJourney, TJourneyDayInput } from './types'
import { buildPairs, calculateDay, summarizeScheduleDay } from './utils'

const MONDAY = '2026-11-09'
const SUNDAY = '2026-11-08'
const TODAY = '2026-11-12'

const punches = (date: string, ...times: string[]): PunchRecord[] =>
  times.map(
    (time) => ({ datetime: new Date(`${date}T${time}:00.000Z`) }) as PunchRecord
  )

const SCHEDULE = {
  startDate: '2026-01-01',
  days: [1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    entry1: timeToMinutes('07:00'),
    exit1: timeToMinutes('11:00'),
    entry2: timeToMinutes('13:00'),
    exit2: timeToMinutes('17:00'),
    entry3: null,
    exit3: null
  }))
} as TScheduleWithDays

const justification = (
  effect: 'deduct' | 'excuse',
  times?: [string, string]
): TJustificationWithType =>
  ({
    startDate: MONDAY,
    endDate: MONDAY,
    startTime: times ? timeToMinutes(times[0]) : null,
    endTime: times ? timeToMinutes(times[1]) : null,
    type: { effect }
  }) as TJustificationWithType

const calculate = (input: Partial<TJourneyDayInput>): TJourney =>
  calculateDay({
    date: MONDAY,
    punchRecords: [],
    schedule: SCHEDULE,
    holiday: null,
    justifications: [],
    today: TODAY,
    ...input
  })

describe('buildPairs', () => {
  test('Pairs each entry with the next punch as its exit', () => {
    expect(
      buildPairs(punches(MONDAY, '07:00', '11:00', '13:00', '17:00'))
    ).toEqual([
      { entry: timeToMinutes('07:00'), exit: timeToMinutes('11:00') },
      { entry: timeToMinutes('13:00'), exit: timeToMinutes('17:00') }
    ])
  })

  test('Leaves the last pair open when the punches are odd', () => {
    expect(buildPairs(punches(MONDAY, '07:00', '11:00', '13:00'))).toEqual([
      { entry: timeToMinutes('07:00'), exit: timeToMinutes('11:00') },
      { entry: timeToMinutes('13:00'), exit: null }
    ])
  })
})

describe('calculateDay', () => {
  test('Expects the hours of the schedule of the weekday', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:00', '11:00', '13:00', '17:00')
      })
    ).toMatchObject({
      kind: 'workday',
      expected: 480,
      worked: 480,
      absence: 0,
      lateness: 0,
      overtime60: 0,
      overtime100: 0
    })
  })

  test('Ignores variations within the tolerance', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:05', '11:00', '13:00', '16:55')
      })
    ).toMatchObject({ worked: 470, lateness: 0, overtime60: 0 })
    expect(
      calculate({
        punchRecords: punches(MONDAY, '06:55', '11:00', '13:00', '17:05')
      })
    ).toMatchObject({ worked: 490, lateness: 0, overtime60: 0 })
  })

  test('Counts the whole variation of a punch beyond the tolerance', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:06', '11:00', '13:00', '17:00')
      })
    ).toMatchObject({ worked: 474, lateness: 6, overtime60: 0 })
  })

  test('Counts the whole variation of a day beyond the tolerance', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '06:56', '11:00', '13:04', '17:04')
      })
    ).toMatchObject({ worked: 484, lateness: 0, overtime60: 4 })
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:04', '10:56', '13:04', '17:00')
      })
    ).toMatchObject({ worked: 468, lateness: 12, overtime60: 0 })
  })

  test('Pays the hours beyond the schedule as overtime of 60%', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:00', '11:00', '13:00', '18:30')
      })
    ).toMatchObject({ worked: 570, overtime60: 90, overtime100: 0 })
  })

  test('Counts a workday without punches as an absence', () => {
    expect(calculate({})).toMatchObject({
      kind: 'workday',
      expected: 480,
      absence: 480,
      lateness: 0
    })
  })

  test('Counts the hours missing in a day with punches as late', () => {
    expect(
      calculate({ punchRecords: punches(MONDAY, '07:00', '11:00') })
    ).toMatchObject({ worked: 240, absence: 0, lateness: 240 })
  })

  test('Pays the hours worked on the day off of the schedule as overtime of 100%', () => {
    expect(
      calculate({
        date: SUNDAY,
        punchRecords: punches(SUNDAY, '08:00', '12:00')
      })
    ).toMatchObject({
      kind: 'day-off',
      expected: 0,
      overtime60: 0,
      overtime100: 240
    })
    expect(calculate({ date: SUNDAY })).toMatchObject({
      kind: 'day-off',
      absence: 0
    })
  })

  test('Pays the hours worked on a holiday as overtime of 100%', () => {
    const holiday = { name: 'Finados' } as Holiday
    expect(
      calculate({
        holiday,
        punchRecords: punches(MONDAY, '07:00', '11:00')
      })
    ).toMatchObject({
      kind: 'holiday',
      holidayName: 'Finados',
      expected: 0,
      lateness: 0,
      overtime100: 240
    })
    expect(calculate({ holiday })).toMatchObject({ absence: 0 })
  })

  test('Excuses the whole day of a justification without times', () => {
    expect(
      calculate({ justifications: [justification('excuse')] })
    ).toMatchObject({ kind: 'excused', expected: 0, absence: 0 })
  })

  test('Excuses only the scheduled hours inside the justified interval', () => {
    expect(
      calculate({
        justifications: [justification('excuse', ['06:00', '12:00'])],
        punchRecords: punches(MONDAY, '13:00', '17:00')
      })
    ).toMatchObject({ expected: 240, worked: 240, lateness: 0, overtime60: 0 })
  })

  test('Deducts the whole day of a justification without times from the hours bank', () => {
    expect(
      calculate({ justifications: [justification('deduct')] })
    ).toMatchObject({ kind: 'workday', expected: 480, dayOff: 480, absence: 0 })
  })

  test('Deducts only the scheduled hours inside the justified interval from the hours bank', () => {
    expect(
      calculate({
        justifications: [justification('deduct', ['13:00', '17:00'])]
      })
    ).toMatchObject({ expected: 480, dayOff: 240, absence: 240 })
    expect(
      calculate({
        justifications: [justification('deduct', ['13:00', '17:00'])],
        punchRecords: punches(MONDAY, '07:00', '11:00')
      })
    ).toMatchObject({ dayOff: 240, lateness: 0, overtime60: 0 })
  })

  test('Pays the hours worked on a day deducted from the hours bank as overtime of 60%', () => {
    expect(
      calculate({
        justifications: [justification('deduct')],
        punchRecords: punches(MONDAY, '07:00', '09:00')
      })
    ).toMatchObject({ dayOff: 480, lateness: 0, overtime60: 120 })
  })

  test('Sums only the complete pairs of a day with odd punches', () => {
    expect(
      calculate({ punchRecords: punches(MONDAY, '07:00', '11:00', '13:00') })
    ).toMatchObject({ hasOddPunches: true, worked: 240, lateness: 240 })
  })

  test('Calculates nothing without a schedule or for a future day', () => {
    const punchRecords = punches(MONDAY, '07:00', '11:00')
    expect(calculate({ schedule: null, punchRecords })).toMatchObject({
      kind: 'no-schedule',
      expected: 0,
      absence: 0,
      lateness: 0
    })
    expect(calculate({ today: SUNDAY })).toMatchObject({
      kind: 'future',
      absence: 0
    })
  })
})

const scheduleDay = (...times: string[]): ScheduleDay =>
  ({
    weekday: 1,
    entry1: null,
    exit1: null,
    entry2: null,
    exit2: null,
    entry3: null,
    exit3: null,
    ...Object.fromEntries(
      ['entry1', 'exit1', 'entry2', 'exit2', 'entry3', 'exit3']
        .slice(0, times.length)
        .map((field, index) => [field, timeToMinutes(times[index])])
    )
  }) as ScheduleDay

describe('summarizeScheduleDay', () => {
  test('Sums the lunch and the journey of the day', () => {
    expect(
      summarizeScheduleDay(scheduleDay('07:00', '11:00', '13:00', '16:20'))
    ).toEqual({
      pairs: [
        { entry: timeToMinutes('07:00'), exit: timeToMinutes('11:00') },
        { entry: timeToMinutes('13:00'), exit: timeToMinutes('16:20') }
      ],
      lunch: 120,
      journey: 440,
      alerts: []
    })
  })

  test('Sums every break of a day with three pairs as lunch', () => {
    const summary = summarizeScheduleDay(
      scheduleDay('07:00', '09:00', '09:30', '11:00', '13:00', '16:00')
    )
    expect(summary.lunch).toBe(150)
    expect(summary.journey).toBe(390)
  })

  test('Returns no pairs for a day off', () => {
    expect(summarizeScheduleDay(scheduleDay())).toEqual({
      pairs: [],
      lunch: 0,
      journey: 0,
      alerts: []
    })
    expect(summarizeScheduleDay().pairs).toEqual([])
  })

  test('Does not alert a day exactly at the limits', () => {
    expect(
      summarizeScheduleDay(scheduleDay('06:00', '12:00', '14:00', '16:00'))
        .alerts
    ).toEqual([])
  })

  test('Alerts a lunch longer than 2 hours', () => {
    expect(
      summarizeScheduleDay(scheduleDay('07:00', '11:00', '13:01', '16:00'))
        .alerts
    ).toEqual(['long-lunch'])
  })

  test('Alerts a journey longer than 8 hours', () => {
    expect(
      summarizeScheduleDay(scheduleDay('07:00', '11:00', '12:00', '16:01'))
        .alerts
    ).toEqual(['long-journey'])
  })

  test('Alerts more than 6 hours in a row without a break', () => {
    expect(
      summarizeScheduleDay(scheduleDay('06:00', '12:01', '14:00', '15:00'))
        .alerts
    ).toEqual(['long-continuous-work'])
    expect(summarizeScheduleDay(scheduleDay('08:00', '15:00')).alerts).toEqual([
      'long-continuous-work'
    ])
  })

  test('Alerts every rule the day breaks', () => {
    expect(
      summarizeScheduleDay(scheduleDay('06:00', '13:00', '15:30', '17:30'))
        .alerts
    ).toEqual(['long-lunch', 'long-journey', 'long-continuous-work'])
  })
})
