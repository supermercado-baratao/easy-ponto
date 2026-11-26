import { describe, expect, test } from 'vitest'

import type { TCycleDayTimes } from '@/models/shift-pattern/utils'

import {
  findShiftConflict,
  getCycleDay,
  resolveDay,
  resolveDays,
  type TShiftAdjustmentInput,
  type TShiftAssignmentInput
} from './utils'

const OFF: TCycleDayTimes = {
  entry1: null,
  exit1: null,
  entry2: null,
  exit2: null,
  entry3: null,
  exit3: null
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const work = (...times: string[]): TCycleDayTimes => ({
  ...OFF,
  ...Object.fromEntries(
    times.map((time, index) => [
      ['entry1', 'exit1', 'entry2', 'exit2', 'entry3', 'exit3'][index],
      toMinutes(time)
    ])
  )
})

const pairs = (...times: string[]): { entry: number; exit: number }[] =>
  Array.from({ length: times.length / 2 }, (_, index) => ({
    entry: toMinutes(times[index * 2]),
    exit: toMinutes(times[index * 2 + 1])
  }))

const version = (
  startDate: string,
  days: TCycleDayTimes[]
): TShiftAssignmentInput['shiftPattern']['versions'][number] => ({
  id: `version-${startDate}`,
  startDate,
  cycleLength: days.length,
  shiftPatternId: 'pattern',
  createdAt: new Date(),
  updatedAt: new Date(),
  days: days.map((day, index) => ({
    ...day,
    id: `day-${startDate}-${index}`,
    cycleDay: index + 1,
    versionId: `version-${startDate}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }))
})

const assignment = (
  data: Partial<Omit<TShiftAssignmentInput, 'shiftPattern'>> & {
    versions: TShiftAssignmentInput['shiftPattern']['versions']
  }
): TShiftAssignmentInput => ({
  id: 'assignment',
  startDate: '2026-11-02',
  endDate: null,
  cycleStartDay: 1,
  ...data,
  shiftPattern: {
    versions: data.versions.toSorted((a, b) =>
      b.startDate.localeCompare(a.startDate)
    )
  }
})

const MORNING = work('08:00', '12:00')
const AFTERNOON = work('13:00', '17:00')

// 12x36: works on day 1 of the cycle, rests on day 2
const TWELVE_BY_THIRTY_SIX = [work('07:00', '19:00'), OFF]

describe('getCycleDay', () => {
  test('Advances one cycle day per date from the start day and wraps around the cycle', () => {
    const link = { startDate: '2026-11-02', cycleStartDay: 3 }

    expect(getCycleDay(link, 4, '2026-11-02')).toBe(3)
    expect(getCycleDay(link, 4, '2026-11-03')).toBe(4)
    expect(getCycleDay(link, 4, '2026-11-04')).toBe(1)
    expect(getCycleDay(link, 4, '2026-11-01')).toBe(2)
  })
})

describe('resolveDay', () => {
  test('Follows the cycle from the day the employee starts in', () => {
    const assignments = [
      assignment({
        cycleStartDay: 2,
        versions: [version('2026-01-01', TWELVE_BY_THIRTY_SIX)]
      })
    ]

    expect(
      resolveDays({
        initialDate: '2026-11-02',
        finalDate: '2026-11-04',
        assignments,
        adjustments: []
      }).map(({ kind }) => kind)
    ).toEqual(['off', 'work', 'off'])
  })

  test('Gives two employees on the same pattern a different day off by their start day', () => {
    const versions = [version('2026-01-01', TWELVE_BY_THIRTY_SIX)]
    const first = resolveDay({
      date: '2026-11-02',
      assignments: [assignment({ cycleStartDay: 1, versions })],
      adjustments: []
    })
    const second = resolveDay({
      date: '2026-11-02',
      assignments: [assignment({ cycleStartDay: 2, versions })],
      adjustments: []
    })

    expect(first.kind).toBe('work')
    expect(second.kind).toBe('off')
  })

  test('Uses the times of the version in effect on the date', () => {
    const assignments = [
      assignment({
        versions: [
          version('2026-01-01', [work('08:00', '17:00')]),
          version('2026-11-10', [work('08:00', '16:00')])
        ]
      })
    ]

    expect(
      resolveDay({ date: '2026-11-09', assignments, adjustments: [] }).pairs
    ).toEqual(pairs('08:00', '17:00'))
    expect(
      resolveDay({ date: '2026-11-10', assignments, adjustments: [] }).pairs
    ).toEqual(pairs('08:00', '16:00'))
  })

  test('Leaves the days outside every link unassigned', () => {
    const assignments = [
      assignment({
        startDate: '2026-11-02',
        endDate: '2026-11-05',
        versions: [version('2026-01-01', [MORNING])]
      })
    ]

    expect(
      resolveDay({ date: '2026-11-01', assignments, adjustments: [] }).kind
    ).toBe('unassigned')
    expect(
      resolveDay({ date: '2026-11-06', assignments, adjustments: [] }).kind
    ).toBe('unassigned')
  })

  test('Adds up the pairs of the patterns in effect on the same day, in order', () => {
    const assignments = [
      assignment({
        id: 'afternoon',
        versions: [version('2026-01-01', [AFTERNOON])]
      }),
      assignment({
        id: 'morning',
        versions: [version('2026-01-01', [MORNING])]
      })
    ]

    expect(
      resolveDay({ date: '2026-11-03', assignments, adjustments: [] })
    ).toEqual({
      date: '2026-11-03',
      kind: 'work',
      pairs: pairs('08:00', '12:00', '13:00', '17:00'),
      adjusted: false
    })
  })

  test('Follows the adjustment of the day over the patterns', () => {
    const assignments = [
      assignment({
        versions: [
          version('2026-01-01', [
            work('08:00', '12:00', '13:00', '17:00'),
            work('08:00', '12:00'),
            work('08:00', '12:00', '13:00', '17:00'),
            OFF
          ])
        ]
      })
    ]
    const adjustment = (
      date: string,
      data: Partial<TShiftAdjustmentInput>
    ): TShiftAdjustmentInput => ({
      date,
      kind: 'off',
      shiftAssignmentId: null,
      ...OFF,
      ...data
    })
    const adjustments = [
      adjustment('2026-11-02', { kind: 'off' }),
      adjustment('2026-11-05', {
        kind: 'work',
        shiftAssignmentId: 'assignment'
      }),
      adjustment('2026-11-06', { kind: 'custom', ...work('10:00', '14:00') })
    ]

    const days = resolveDays({
      initialDate: '2026-11-02',
      finalDate: '2026-11-06',
      assignments,
      adjustments
    })
    const [off, swapped, custom] = [days[0], days[3], days[4]]

    expect(off).toMatchObject({ kind: 'off', pairs: [], adjusted: true })
    expect(swapped).toMatchObject({
      kind: 'work',
      pairs: pairs('08:00', '12:00', '13:00', '17:00'),
      adjusted: true
    })
    expect(custom).toMatchObject({
      kind: 'work',
      pairs: pairs('10:00', '14:00'),
      adjusted: true
    })
  })
})

const link = (
  days: TCycleDayTimes[],
  data: Partial<Omit<TShiftAssignmentInput, 'shiftPattern'>> = {}
): TShiftAssignmentInput =>
  assignment({ ...data, versions: [version('2026-01-01', days)] })

const NIGHT: TCycleDayTimes = {
  ...OFF,
  entry1: toMinutes('22:00'),
  exit1: toMinutes('06:00') + 1440
}

describe('findShiftConflict', () => {
  test('Accepts patterns in effect together whose times fit the same days', () => {
    const afternoon = link([AFTERNOON], { id: 'other' })

    expect(findShiftConflict(link([MORNING]), [afternoon])).toBeNull()
  })

  test('Finds the first day the times of the patterns overlap', () => {
    const lateMorning = work('11:00', '14:00')
    const morning = link([MORNING], { id: 'other' })

    expect(findShiftConflict(link([OFF, OFF, lateMorning]), [morning])).toEqual(
      { date: '2026-11-04', reason: 'overlap' }
    )
  })

  test('Finds a day with more pairs than a day holds', () => {
    const edges = work('06:00', '07:00', '18:00', '19:00')
    const fullDay = link([work('08:00', '12:00', '13:00', '17:00')], {
      id: 'other'
    })

    expect(findShiftConflict(link([edges]), [fullDay])).toEqual({
      date: '2026-11-02',
      reason: 'too-many-pairs'
    })
  })

  test('Finds a shift that starts before the night shift of the day before ends', () => {
    const early = work('05:00', '09:00')
    const night = link([NIGHT, OFF], { id: 'other', startDate: '2026-11-01' })

    expect(findShiftConflict(link([early, OFF]), [night])).toEqual({
      date: '2026-11-02',
      reason: 'overlap'
    })
  })

  test('Ignores the links that ended before the new one starts', () => {
    const ended = link([MORNING], {
      id: 'other',
      startDate: '2026-10-01',
      endDate: '2026-11-01'
    })

    expect(findShiftConflict(link([MORNING]), [ended])).toBeNull()
  })
})
