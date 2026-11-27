import { describe, expect, test } from 'vitest'

import type {
  Holiday,
  PunchRecord,
  TJustificationWithType
} from '@/infra/database/types'
import { timeToMinutes } from '@/infra/time'
import { DEFAULT_JOURNEY_RULES } from '@/models/journey-rules/utils'
import type { TResolvedDay } from '@/models/shift-assignment/utils'

import type {
  TJourney,
  TJourneyCalculationRules,
  TJourneyDay,
  TJourneyDayInput,
  TOvertime
} from './types'
import {
  buildPairs,
  calculateDay,
  getOvertimePercentages,
  mergeOvertime,
  splitOvertime,
  sumDays,
  summarizeScheduleDay,
  UNBANDED_PERCENTAGE
} from './utils'

const MONDAY = '2026-11-09'
const SUNDAY = '2026-11-08'
const TODAY = '2026-11-12'

const punches = (date: string, ...times: string[]): PunchRecord[] =>
  times.map(
    (time) => ({ datetime: new Date(`${date}T${time}:00.000Z`) }) as PunchRecord
  )

const pairs = (...times: string[]): TResolvedDay['pairs'] =>
  Array.from({ length: times.length / 2 }, (_, index) => ({
    entry: timeToMinutes(times[index * 2]),
    exit: timeToMinutes(times[index * 2 + 1])
  }))

const WORKDAY: TResolvedDay = {
  date: MONDAY,
  kind: 'work',
  pairs: pairs('07:00', '11:00', '13:00', '17:00'),
  adjusted: false
}

const DAY_OFF: TResolvedDay = {
  date: SUNDAY,
  kind: 'off',
  pairs: [],
  adjusted: false
}

const RULES: TJourneyCalculationRules = {
  journeyRules: DEFAULT_JOURNEY_RULES,
  overtimeBands: [
    { dayKind: 'workday', upTo: null, percentage: 60 },
    { dayKind: 'day-off', upTo: null, percentage: 100 },
    { dayKind: 'holiday', upTo: null, percentage: 100 }
  ]
}

const overtime = (percentage: number, minutes: number): TOvertime =>
  minutes === 0 ? [] : [{ percentage, minutes }]

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
    shiftDay: WORKDAY,
    holiday: null,
    justifications: [],
    rules: RULES,
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
      overtime: []
    })
  })

  test('Ignores variations within the tolerance', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:05', '11:00', '13:00', '16:55')
      })
    ).toMatchObject({ worked: 470, lateness: 0, overtime: [] })
    expect(
      calculate({
        punchRecords: punches(MONDAY, '06:55', '11:00', '13:00', '17:05')
      })
    ).toMatchObject({ worked: 490, lateness: 0, overtime: [] })
  })

  test('Counts the whole variation of a punch beyond the tolerance', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:06', '11:00', '13:00', '17:00')
      })
    ).toMatchObject({ worked: 474, lateness: 6, overtime: [] })
  })

  test('Counts the whole variation of a day beyond the tolerance', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '06:56', '11:00', '13:04', '17:04')
      })
    ).toMatchObject({ worked: 484, lateness: 0, overtime: overtime(60, 4) })
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:04', '10:56', '13:04', '17:00')
      })
    ).toMatchObject({ worked: 468, lateness: 12, overtime: [] })
  })

  test('Pays the hours beyond the schedule by the bands of the workday', () => {
    expect(
      calculate({
        punchRecords: punches(MONDAY, '07:00', '11:00', '13:00', '18:30')
      })
    ).toMatchObject({ worked: 570, overtime: overtime(60, 90) })
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

  test('Pays the hours worked on the day off of the schedule by the bands of the day off', () => {
    expect(
      calculate({
        date: SUNDAY,
        shiftDay: DAY_OFF,
        punchRecords: punches(SUNDAY, '08:00', '12:00')
      })
    ).toMatchObject({
      kind: 'day-off',
      expected: 0,
      overtime: overtime(100, 240)
    })
    expect(calculate({ date: SUNDAY, shiftDay: DAY_OFF })).toMatchObject({
      kind: 'day-off',
      absence: 0
    })
  })

  test('Pays the hours worked on a holiday by the bands of the holiday', () => {
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
      overtime: overtime(100, 240)
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
    ).toMatchObject({ expected: 240, worked: 240, lateness: 0, overtime: [] })
  })

  test('Deducts the whole day of a justification without times from the hours bank', () => {
    expect(
      calculate({ justifications: [justification('deduct')] })
    ).toMatchObject({
      kind: 'workday',
      expected: 480,
      compensation: 480,
      absence: 0
    })
  })

  test('Deducts only the scheduled hours inside the justified interval from the hours bank', () => {
    expect(
      calculate({
        justifications: [justification('deduct', ['13:00', '17:00'])]
      })
    ).toMatchObject({ expected: 480, compensation: 240, absence: 240 })
    expect(
      calculate({
        justifications: [justification('deduct', ['13:00', '17:00'])],
        punchRecords: punches(MONDAY, '07:00', '11:00')
      })
    ).toMatchObject({ compensation: 240, lateness: 0, overtime: [] })
  })

  test('Pays the hours worked on a day deducted from the hours bank by the bands of the workday', () => {
    expect(
      calculate({
        justifications: [justification('deduct')],
        punchRecords: punches(MONDAY, '07:00', '09:00')
      })
    ).toMatchObject({
      compensation: 480,
      lateness: 0,
      overtime: overtime(60, 120)
    })
  })

  test('Sums only the complete pairs of a day with odd punches', () => {
    expect(
      calculate({ punchRecords: punches(MONDAY, '07:00', '11:00', '13:00') })
    ).toMatchObject({ hasOddPunches: true, worked: 240, lateness: 240 })
  })

  test('Takes the pairs of the shift day, including an adjusted one', () => {
    expect(
      calculate({
        shiftDay: {
          ...WORKDAY,
          pairs: pairs('08:00', '12:00'),
          adjusted: true
        },
        punchRecords: punches(MONDAY, '08:00', '12:00')
      })
    ).toMatchObject({ kind: 'workday', expected: 240, lateness: 0 })
  })

  test('Follows the tolerances of the company', () => {
    const rules = {
      ...RULES,
      journeyRules: { punchTolerance: 10, dailyTolerance: 20 }
    }
    expect(
      calculate({
        rules,
        punchRecords: punches(MONDAY, '07:10', '11:00', '13:00', '16:50')
      })
    ).toMatchObject({ worked: 460, lateness: 0 })
    expect(
      calculate({
        rules,
        punchRecords: punches(MONDAY, '07:11', '11:00', '13:00', '17:00')
      })
    ).toMatchObject({ worked: 469, lateness: 11 })
  })

  test('Calculates nothing without a schedule or for a future day', () => {
    const punchRecords = punches(MONDAY, '07:00', '11:00')
    for (const shiftDay of [
      null,
      { ...DAY_OFF, kind: 'unassigned' as const }
    ]) {
      expect(calculate({ shiftDay, punchRecords })).toMatchObject({
        kind: 'no-schedule',
        expected: 0,
        absence: 0,
        lateness: 0,
        overtime: []
      })
    }
    expect(calculate({ today: SUNDAY })).toMatchObject({
      kind: 'future',
      absence: 0
    })
  })
})

const LIMITS = {
  maxLunch: DEFAULT_JOURNEY_RULES.maxLunch,
  maxDailyJourney: DEFAULT_JOURNEY_RULES.maxDailyJourney,
  maxContinuousWork: DEFAULT_JOURNEY_RULES.maxContinuousWork
}

const summarize = (
  ...times: string[]
): ReturnType<typeof summarizeScheduleDay> =>
  summarizeScheduleDay(pairs(...times), LIMITS)

describe('summarizeScheduleDay', () => {
  test('Sums the lunch and the journey of the day', () => {
    expect(summarize('07:00', '11:00', '13:00', '16:20')).toEqual({
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
    const summary = summarize(
      '07:00',
      '09:00',
      '09:30',
      '11:00',
      '13:00',
      '16:00'
    )
    expect(summary.lunch).toBe(150)
    expect(summary.journey).toBe(390)
  })

  test('Returns no pairs for a day off', () => {
    expect(summarize()).toEqual({
      pairs: [],
      lunch: 0,
      journey: 0,
      alerts: []
    })
  })

  test('Does not alert a day exactly at the limits', () => {
    expect(summarize('06:00', '12:00', '14:00', '16:00').alerts).toEqual([])
  })

  test('Alerts a lunch longer than 2 hours', () => {
    expect(summarize('07:00', '11:00', '13:01', '16:00').alerts).toEqual([
      'long-lunch'
    ])
  })

  test('Alerts a journey longer than 8 hours', () => {
    expect(summarize('07:00', '11:00', '12:00', '16:01').alerts).toEqual([
      'long-journey'
    ])
  })

  test('Alerts more than 6 hours in a row without a break', () => {
    expect(summarize('06:00', '12:01', '14:00', '15:00').alerts).toEqual([
      'long-continuous-work'
    ])
    expect(summarize('08:00', '15:00').alerts).toEqual(['long-continuous-work'])
  })

  test('Follows the limits of the company', () => {
    expect(
      summarizeScheduleDay(pairs('07:00', '11:00', '12:30', '16:00'), {
        maxLunch: 60,
        maxDailyJourney: 420,
        maxContinuousWork: 240
      }).alerts
    ).toEqual(['long-lunch', 'long-journey'])
  })

  test('Alerts every rule the day breaks', () => {
    expect(summarize('06:00', '13:00', '15:30', '17:30').alerts).toEqual([
      'long-lunch',
      'long-journey',
      'long-continuous-work'
    ])
  })
})

const journeyDay = (input: Partial<TJourneyDayInput>): TJourneyDay => ({
  date: input.date ?? MONDAY,
  punchRecords: input.punchRecords ?? [],
  journey: calculate(input)
})

describe('sumDays', () => {
  test('Sums the calculated days and leaves out the ones without a schedule', () => {
    const days = [
      journeyDay({
        punchRecords: punches(MONDAY, '07:00', '11:00', '13:00', '18:00')
      }),
      journeyDay({ date: '2026-11-10' }),
      journeyDay({
        shiftDay: null,
        punchRecords: punches(MONDAY, '07:00', '11:00')
      })
    ]
    expect(sumDays(days)).toEqual({
      expected: 960,
      worked: 540,
      absence: 480,
      lateness: 0,
      compensation: 0,
      overtime: overtime(60, 60)
    })
  })
})

describe('splitOvertime', () => {
  const BANDS: TJourneyCalculationRules['overtimeBands'] = [
    { dayKind: 'workday', upTo: 120, percentage: 50 },
    { dayKind: 'workday', upTo: null, percentage: 100 },
    { dayKind: 'holiday', upTo: null, percentage: 150 }
  ]

  test('Fills each band up to its limit and the last one with the rest', () => {
    expect(splitOvertime(90, 'workday', BANDS)).toEqual([
      { percentage: 50, minutes: 90 }
    ])
    expect(splitOvertime(120, 'workday', BANDS)).toEqual([
      { percentage: 50, minutes: 120 }
    ])
    expect(splitOvertime(200, 'workday', BANDS)).toEqual([
      { percentage: 50, minutes: 120 },
      { percentage: 100, minutes: 80 }
    ])
  })

  test('Takes only the bands of the kind of day', () => {
    expect(splitOvertime(200, 'holiday', BANDS)).toEqual([
      { percentage: 150, minutes: 200 }
    ])
  })

  test('Keeps the overtime of a kind of day without bands apart', () => {
    expect(splitOvertime(30, 'day-off', BANDS)).toEqual([
      { percentage: UNBANDED_PERCENTAGE, minutes: 30 }
    ])
  })

  test('Returns no overtime for zero or less', () => {
    expect(splitOvertime(0, 'workday', BANDS)).toEqual([])
    expect(splitOvertime(-15, 'workday', BANDS)).toEqual([])
  })

  test('Merges the bands with the same percentage', () => {
    expect(
      splitOvertime(200, 'workday', [
        { dayKind: 'workday', upTo: 60, percentage: 100 },
        { dayKind: 'workday', upTo: null, percentage: 100 }
      ])
    ).toEqual([{ percentage: 100, minutes: 200 }])
  })
})

describe('mergeOvertime', () => {
  test('Sums the minutes by percentage and leaves out the empty ones', () => {
    expect(
      mergeOvertime(
        [{ percentage: 100, minutes: 30 }],
        [
          { percentage: 50, minutes: 20 },
          { percentage: 100, minutes: 10 },
          { percentage: 70, minutes: 0 }
        ]
      )
    ).toEqual([
      { percentage: 50, minutes: 20 },
      { percentage: 100, minutes: 40 }
    ])
  })
})

describe('getOvertimePercentages', () => {
  test('Joins the percentages of the bands and of the overtime, in order', () => {
    expect(
      getOvertimePercentages({
        overtimeBands: [{ percentage: 100 }, { percentage: 50 }],
        overtimes: [[{ percentage: 60, minutes: 30 }], []]
      })
    ).toEqual([50, 60, 100])
  })
})
