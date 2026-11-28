import { describe, expect, test } from 'vitest'

import {
  resolveDays,
  type TShiftAdjustmentInput,
  type TShiftAssignmentInput
} from '@/models/shift-assignment/utils'
import type { TCycleDayTimes } from '@/models/shift-pattern/utils'

import {
  findRestMoves,
  findUnmovedRests,
  isInWindow,
  toRuleAdjustments,
  type TRestMove,
  type TRestRuleInput,
  type TRestUserDays
} from './utils'

const OFF: TCycleDayTimes = {
  entry1: null,
  exit1: null,
  entry2: null,
  exit2: null,
  entry3: null,
  exit3: null
}

const FULL_DAY: TCycleDayTimes = {
  ...OFF,
  entry1: 8 * 60,
  exit1: 12 * 60,
  entry2: 13 * 60,
  exit2: 17 * 60
}

const HALF_DAY: TCycleDayTimes = { ...OFF, entry1: 8 * 60, exit1: 12 * 60 }

// The cycle starts on Monday, March 1, 2027
const SIX_BY_ONE = [
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  OFF
]

const SHORT_SATURDAY = [
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  FULL_DAY,
  HALF_DAY,
  OFF
]

// Friday keeps the load and breaks the weekday, Saturday the other way around
const createConflict = (
  loadPosition: number,
  weekdayPosition: number
): TRestRuleInput =>
  createRule({
    windowEndDay: 27,
    distances: [1, 2],
    blockedWeekdays: [5],
    constraints: [
      {
        constraint: 'blocked-weekdays',
        level: 'preferred',
        position: weekdayPosition
      },
      { constraint: 'same-load', level: 'preferred', position: loadPosition }
    ]
  })

const createAssignment = (
  days: TCycleDayTimes[]
): TRestUserDays['assignments'][number] => ({
  id: 'assignment',
  shiftPatternId: 'pattern',
  startDate: '2027-03-01',
  endDate: null,
  cycleStartDay: 1,
  shiftPattern: {
    versions: [
      {
        id: 'version',
        startDate: '2027-03-01',
        cycleLength: days.length,
        shiftPatternId: 'pattern',
        createdAt: new Date(),
        updatedAt: new Date(),
        days: days.map((day, index) => ({
          ...day,
          id: `day-${index}`,
          cycleDay: index + 1,
          versionId: 'version',
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      }
    ]
  } satisfies Pick<TShiftAssignmentInput['shiftPattern'], 'versions'>
})

const createRule = (rule: Partial<TRestRuleInput> = {}): TRestRuleInput => ({
  id: 'rule',
  name: 'Folga na janela',
  windowStartDay: 5,
  windowEndDay: 25,
  distances: [2, 4, 6, 1],
  blockedWeekdays: [],
  holidayRest: 'window',
  shiftPatternIds: ['pattern'],
  constraints: [],
  ...rule
})

const createUser = ({
  days = SIX_BY_ONE,
  finalDate = '2027-03-31',
  adjustments = []
}: {
  days?: TCycleDayTimes[]
  finalDate?: string
  adjustments?: TShiftAdjustmentInput[]
} = {}): TRestUserDays => {
  const assignment = createAssignment(days)
  return {
    userId: 'user',
    assignments: [assignment],
    days: resolveDays({
      initialDate: '2027-03-01',
      finalDate,
      assignments: [assignment],
      adjustments
    })
  }
}

const findMoves = ({
  rule = createRule(),
  user = createUser(),
  holidays = []
}: {
  rule?: TRestRuleInput
  user?: TRestUserDays
  holidays?: string[]
} = {}): Pick<TRestMove, 'date' | 'reason' | 'target' | 'unmetConstraints'>[] =>
  findRestMoves({
    rules: [rule],
    users: [user],
    isHoliday: (date) => holidays.includes(date)
  }).map(({ date, reason, target, unmetConstraints }) => ({
    date,
    reason,
    target,
    unmetConstraints
  }))

describe('isInWindow', () => {
  test('Ends the window on the last day of a shorter month', () => {
    const rule = { windowStartDay: 5, windowEndDay: 31 }
    expect(isInWindow(rule, '2027-02-28')).toBe(true)
    expect(isInWindow(rule, '2027-02-04')).toBe(false)
  })
})

describe('findRestMoves', () => {
  test('Moves only the days off outside the window, each by the first distance that fits', () => {
    expect(findMoves({ rule: createRule({ windowStartDay: 10 }) })).toEqual([
      {
        date: '2027-03-07',
        reason: 'outside-window',
        target: '2027-03-11',
        unmetConstraints: []
      },
      {
        date: '2027-03-28',
        reason: 'outside-window',
        target: '2027-03-24',
        unmetConstraints: []
      }
    ])
  })

  test('Leaves a day off unmoved when no distance reaches a workday in the window', () => {
    const moves = findMoves({
      rule: createRule({ windowStartDay: 10, windowEndDay: 20 })
    })

    expect(moves.map(({ date, target }) => ({ date, target }))).toEqual([
      { date: '2027-03-07', target: '2027-03-11' },
      { date: '2027-03-21', target: '2027-03-19' },
      { date: '2027-03-28', target: null }
    ])
  })

  test('Never moves two days off to the same day', () => {
    const days = [OFF, FULL_DAY, FULL_DAY, FULL_DAY, FULL_DAY, FULL_DAY, OFF]
    const moves = findMoves({
      rule: createRule({ windowStartDay: 10, distances: [2, 3] }),
      user: createUser({ days })
    }).filter(({ date }) => ['2027-03-07', '2027-03-08'].includes(date))

    expect(moves.map(({ date, target }) => ({ date, target }))).toEqual([
      { date: '2027-03-07', target: '2027-03-10' },
      { date: '2027-03-08', target: '2027-03-11' }
    ])
  })

  test('Keeps a day off that has a manual adjustment', () => {
    const user = createUser({
      adjustments: [
        { date: '2027-03-28', kind: 'off', shiftAssignmentId: null, ...OFF }
      ]
    })

    expect(findMoves({ user })).toEqual([])
  })

  test('Skips the days a manual adjustment already changed', () => {
    const user = createUser({
      adjustments: [
        {
          date: '2027-03-24',
          kind: 'custom',
          shiftAssignmentId: null,
          ...HALF_DAY
        }
      ]
    })

    expect(findMoves({ user })[0].target).toBe('2027-03-22')
  })

  describe('Holiday on the day off', () => {
    const insideWindow = '2027-03-14'
    const outsideWindow = '2027-03-28'

    test('Always counts as the rest with the "always" policy', () => {
      expect(
        findMoves({
          rule: createRule({ holidayRest: 'always' }),
          holidays: [insideWindow, outsideWindow]
        })
      ).toEqual([])
    })

    test('Counts as the rest only inside the window with the "window" policy', () => {
      expect(
        findMoves({ holidays: [insideWindow, outsideWindow] }).map(
          ({ date, reason }) => ({ date, reason })
        )
      ).toEqual([{ date: outsideWindow, reason: 'holiday' }])
    })

    test('Never counts as the rest with the "never" policy', () => {
      expect(
        findMoves({
          rule: createRule({ holidayRest: 'never' }),
          holidays: [insideWindow]
        }).map(({ date, reason, target }) => ({ date, reason, target }))
      ).toEqual([
        { date: insideWindow, reason: 'holiday', target: '2027-03-16' },
        { date: outsideWindow, reason: 'outside-window', target: '2027-03-24' }
      ])
    })
  })

  describe('Constraints', () => {
    test('Skips the blocked weekdays when the constraint is required', () => {
      const rule = createRule({
        blockedWeekdays: [3],
        constraints: [
          { constraint: 'blocked-weekdays', level: 'required', position: null }
        ]
      })

      expect(findMoves({ rule }).at(-1)?.target).toBe('2027-03-22')
    })

    test('Leaves the day off unmoved when a required constraint fails on every candidate', () => {
      const rule = createRule({
        blockedWeekdays: [1, 2, 3, 4, 5, 6],
        constraints: [
          { constraint: 'blocked-weekdays', level: 'required', position: null }
        ]
      })

      expect(findMoves({ rule }).at(-1)?.target).toBeNull()
    })

    test('Breaks a preferred constraint that fails on every candidate and reports it', () => {
      const rule = createRule({
        blockedWeekdays: [1, 2, 3, 4, 5, 6],
        constraints: [
          { constraint: 'blocked-weekdays', level: 'preferred', position: 1 }
        ]
      })

      expect(findMoves({ rule }).at(-1)).toMatchObject({
        target: '2027-03-24',
        unmetConstraints: ['blocked-weekdays']
      })
    })

    test('Skips the holidays when the constraint is required', () => {
      const rule = createRule({
        constraints: [
          { constraint: 'no-holiday', level: 'required', position: null }
        ]
      })

      expect(findMoves({ rule, holidays: ['2027-03-24'] }).at(-1)?.target).toBe(
        '2027-03-22'
      )
    })

    test('Prefers a day with the load of the day worked in place of the day off', () => {
      const days = SHORT_SATURDAY
      const rule = createRule({ windowEndDay: 27, distances: [1, 2] })
      const sameLoad = createRule({
        ...rule,
        constraints: [
          { constraint: 'same-load', level: 'preferred', position: 1 }
        ]
      })
      const user = createUser({ days })

      expect(findMoves({ rule, user }).at(-1)?.target).toBe('2027-03-27')
      expect(findMoves({ rule: sameLoad, user }).at(-1)?.target).toBe(
        '2027-03-26'
      )
    })

    test('Yields the preferred constraint of the lowest position first', () => {
      const user = createUser({ days: SHORT_SATURDAY })
      expect(
        findMoves({ rule: createConflict(2, 1), user }).at(-1)
      ).toMatchObject({
        target: '2027-03-26',
        unmetConstraints: ['blocked-weekdays']
      })
      expect(
        findMoves({ rule: createConflict(1, 2), user }).at(-1)
      ).toMatchObject({ target: '2027-03-27', unmetConstraints: ['same-load'] })
    })

    test('Keeps the day off in its month only when the constraint asks for it', () => {
      const rule = createRule({
        windowStartDay: 1,
        windowEndDay: 3,
        distances: [4]
      })
      const user = createUser({ finalDate: '2027-04-30' })
      const sameMonth = createRule({
        ...rule,
        constraints: [
          { constraint: 'same-month', level: 'required', position: null }
        ]
      })

      expect(
        findMoves({ rule, user }).find(({ date }) => date === '2027-03-28')
          ?.target
      ).toBe('2027-04-01')
      expect(
        findMoves({ rule: sameMonth, user }).find(
          ({ date }) => date === '2027-03-28'
        )?.target
      ).toBeNull()
    })
  })

  test('Ignores the employees whose patterns follow no rule', () => {
    expect(
      findMoves({ rule: createRule({ shiftPatternIds: ['other'] }) })
    ).toEqual([])
  })
})

describe('toRuleAdjustments', () => {
  test('Works the day off and rests on the target, keeping the holiday off', () => {
    const moves = findRestMoves({
      rules: [createRule({ holidayRest: 'never' })],
      users: [createUser()],
      isHoliday: (date) => date === '2027-03-14'
    })

    expect(toRuleAdjustments(moves)).toEqual([
      {
        userId: 'user',
        date: '2027-03-14',
        kind: 'off',
        shiftAssignmentId: null
      },
      {
        userId: 'user',
        date: '2027-03-16',
        kind: 'off',
        shiftAssignmentId: null
      },
      {
        userId: 'user',
        date: '2027-03-28',
        kind: 'work',
        shiftAssignmentId: 'assignment'
      },
      {
        userId: 'user',
        date: '2027-03-24',
        kind: 'off',
        shiftAssignmentId: null
      }
    ])
  })

  test('Saves nothing for a day off left unmoved', () => {
    const moves = findRestMoves({
      rules: [createRule({ distances: [1] })],
      users: [createUser()],
      isHoliday: () => false
    })

    expect(toRuleAdjustments(moves)).toEqual([])
  })
})

describe('findUnmovedRests', () => {
  test('Lists the days off to move that have no adjustment yet', () => {
    const user = createUser({
      adjustments: [
        {
          date: '2027-03-28',
          kind: 'work',
          shiftAssignmentId: 'assignment',
          ...OFF
        }
      ]
    })

    expect(
      findUnmovedRests({
        rules: [createRule({ windowStartDay: 10 })],
        users: [user],
        isHoliday: () => false
      })
    ).toEqual([
      { userId: 'user', date: '2027-03-07', ruleName: 'Folga na janela' }
    ])
  })
})
