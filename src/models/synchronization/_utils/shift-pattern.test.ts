import { describe, expect, test } from 'vitest'

import type {
  TShiftAssignmentWithPattern,
  TShiftPatternWithVersions,
  User
} from '@/infra/database/types'
import type { TReportSchedule } from '@/models/time-card-report/types'

import { getShiftPatternsToImport, getWeekCycleDay } from './shift-pattern'

const COMPANY_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

// 2026-11-01 is a Sunday
const START_DATE = '2026-11-01'

const user = (id: string, name: string): User =>
  ({ id, name, companyId: COMPANY_ID }) as User

const USERS = [
  user('user-1', 'Ana'),
  user('user-2', 'Bruno'),
  user('user-3', 'Carla')
]

const SIX_BY_ONE = Object.fromEntries(
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].flatMap(
    (weekday) => [
      [`${weekday}Entry1`, '08:00'],
      [`${weekday}Exit1`, '12:00'],
      [`${weekday}Entry2`, '13:00'],
      [`${weekday}Exit2`, '16:20']
    ]
  )
)

const FIVE_BY_TWO = Object.fromEntries(
  Object.entries(SIX_BY_ONE).filter(([field]) => !field.startsWith('saturday'))
)

const schedule = (
  name: string,
  times: Record<string, string>
): TReportSchedule => ({ userName: name, startDate: START_DATE, ...times })

const importPatterns = (
  reportSchedules: TReportSchedule[],
  saved: {
    patterns?: TShiftPatternWithVersions[]
    assignments?: TShiftAssignmentWithPattern[]
  } = {}
): ReturnType<typeof getShiftPatternsToImport> =>
  getShiftPatternsToImport({
    companyId: COMPANY_ID,
    reportSchedules,
    users: USERS,
    savedPatterns: saved.patterns ?? [],
    savedAssignments: saved.assignments ?? []
  })

const SAVED_ID = 'saved'

const toSavedPattern = ({
  name,
  version
}: ReturnType<
  typeof importPatterns
>['shiftPatterns'][number]): TShiftPatternWithVersions => ({
  id: SAVED_ID,
  name,
  companyId: COMPANY_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  versions: [
    {
      id: `${SAVED_ID}-version`,
      startDate: version.startDate,
      cycleLength: version.cycleLength,
      shiftPatternId: SAVED_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
      days: version.days.map((day) => ({
        ...day,
        id: `${SAVED_ID}-${day.cycleDay}`,
        versionId: `${SAVED_ID}-version`,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    }
  ]
})

describe('getWeekCycleDay', () => {
  test('Counts the week cycle from Monday', () => {
    expect(getWeekCycleDay('2026-11-02')).toBe(1)
    expect(getWeekCycleDay('2026-11-07')).toBe(6)
    expect(getWeekCycleDay('2026-11-08')).toBe(7)
  })
})

describe('getShiftPatternsToImport', () => {
  test('Turns the weekly schedule into a 7 day pattern starting on Monday', () => {
    const { shiftPatterns } = importPatterns([schedule('Ana', SIX_BY_ONE)])

    expect(shiftPatterns).toHaveLength(1)
    const [{ version }] = shiftPatterns
    expect(version.startDate).toBe(START_DATE)
    expect(version.cycleLength).toBe(7)
    expect(version.days[0]).toEqual({
      cycleDay: 1,
      entry1: 480,
      exit1: 720,
      entry2: 780,
      exit2: 980,
      entry3: null,
      exit3: null
    })
    expect(version.days[6].entry1).toBeNull()
  })

  test('Shares one pattern between the employees with the same schedule', () => {
    const { shiftPatterns, shiftAssignments } = importPatterns([
      schedule('Ana', SIX_BY_ONE),
      schedule('Bruno', SIX_BY_ONE),
      schedule('Carla', FIVE_BY_TWO)
    ])

    expect(shiftPatterns.map(({ name }) => name)).toEqual([
      'Seg a Sáb 08:00–16:20',
      'Seg a Sex 08:00–16:20'
    ])
    expect(shiftAssignments).toEqual([
      {
        userId: 'user-1',
        startDate: START_DATE,
        cycleStartDay: 7,
        shiftPatternKey: shiftPatterns[0].key
      },
      {
        userId: 'user-2',
        startDate: START_DATE,
        cycleStartDay: 7,
        shiftPatternKey: shiftPatterns[0].key
      },
      {
        userId: 'user-3',
        startDate: START_DATE,
        cycleStartDay: 7,
        shiftPatternKey: shiftPatterns[1].key
      }
    ])
  })

  test('Adds a number to a name the company already uses', () => {
    const [fiveByTwo] = importPatterns([
      schedule('Ana', FIVE_BY_TWO)
    ]).shiftPatterns
    const saved = {
      ...toSavedPattern(fiveByTwo),
      name: 'seg a sáb 08:00–16:20'
    }

    const { shiftPatterns } = importPatterns([schedule('Ana', SIX_BY_ONE)], {
      patterns: [saved]
    })

    expect(shiftPatterns[0].name).toBe('Seg a Sáb 08:00–16:20 (2)')
  })

  test('Reuses a saved pattern with the same week', () => {
    const [imported] = importPatterns([
      schedule('Ana', SIX_BY_ONE)
    ]).shiftPatterns

    const { shiftPatterns, shiftAssignments } = importPatterns(
      [schedule('Ana', SIX_BY_ONE)],
      { patterns: [toSavedPattern(imported)] }
    )

    expect(shiftPatterns).toEqual([])
    expect(shiftAssignments).toEqual([
      {
        userId: 'user-1',
        startDate: START_DATE,
        cycleStartDay: 7,
        shiftPatternId: 'saved'
      }
    ])
  })

  test('Keeps the link of an employee who already follows the imported week', () => {
    const [imported] = importPatterns([
      schedule('Ana', SIX_BY_ONE)
    ]).shiftPatterns
    const savedPattern = toSavedPattern(imported)

    const { shiftAssignments } = importPatterns([schedule('Ana', SIX_BY_ONE)], {
      patterns: [savedPattern],
      assignments: [
        {
          id: 'assignment',
          userId: 'user-1',
          shiftPatternId: 'saved',
          startDate: '2026-10-01',
          endDate: null,
          // 2026-10-01 is a Thursday
          cycleStartDay: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
          shiftPattern: savedPattern
        }
      ]
    })

    expect(shiftAssignments).toEqual([])
  })

  test('Skips the employees without a saved user or without any workday', () => {
    const { shiftPatterns, shiftAssignments } = importPatterns([
      schedule('Desconhecido', SIX_BY_ONE),
      schedule('Ana', {})
    ])

    expect(shiftPatterns).toEqual([])
    expect(shiftAssignments).toEqual([])
  })
})
