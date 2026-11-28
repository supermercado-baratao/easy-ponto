import { describe, expect, test } from 'vitest'

import type { TRestRestrictionInput } from '@/models/rest-restriction/utils'
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
  planRestMonth,
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

const createRestriction = (
  restriction: Partial<TRestRestrictionInput> = {}
): TRestRestrictionInput => ({
  id: 'restriction',
  kind: 'together',
  level: 'required',
  maxOff: 1,
  weekdays: [],
  userNames: ['Ana', 'Bruno'],
  groupName: null,
  userIds: ['user', 'colleague'],
  ...restriction
})

// The colleague follows a pattern without a rule, so only their days off count
const createColleague = (offDates: string[] = []): TRestUserDays => {
  const user = createUser({
    adjustments: offDates.map((date) => ({
      date,
      kind: 'off',
      shiftAssignmentId: null,
      ...OFF
    }))
  })
  return {
    ...user,
    userId: 'colleague',
    assignments: user.assignments.map((assignment) => ({
      ...assignment,
      shiftPatternId: 'other'
    }))
  }
}

const findFirstMove = ({
  rule = createRule({ windowStartDay: 10 }),
  users,
  restrictions
}: {
  rule?: TRestRuleInput
  users: TRestUserDays[]
  restrictions: TRestRestrictionInput[]
}): Pick<
  TRestMove,
  'userId' | 'target' | 'unmetConstraints' | 'brokenRestrictions'
> => {
  const [move] = findRestMoves({
    rules: [rule],
    users,
    restrictions,
    isHoliday: () => false
  })
  return {
    userId: move.userId,
    target: move.target,
    unmetConstraints: move.unmetConstraints,
    brokenRestrictions: move.brokenRestrictions
  }
}

describe('findRestMoves with restrictions between employees', () => {
  test('Skips the days that break a required restriction', () => {
    expect(
      findFirstMove({
        users: [createUser(), createColleague(['2027-03-11'])],
        restrictions: [createRestriction()]
      })
    ).toEqual({
      userId: 'user',
      target: '2027-03-13',
      unmetConstraints: [],
      brokenRestrictions: []
    })
  })

  test('Leaves the day off unmoved when every day breaks a required restriction', () => {
    const [move] = findRestMoves({
      rules: [createRule({ windowStartDay: 10, distances: [4] })],
      users: [createUser(), createColleague(['2027-03-11'])],
      restrictions: [createRestriction()],
      isHoliday: () => false
    })

    expect(move.target).toBeNull()
  })

  test('Breaks a preferred restriction only when no other day keeps it', () => {
    const restriction = createRestriction({ level: 'preferred' })

    expect(
      findFirstMove({
        users: [createUser(), createColleague(['2027-03-11'])],
        restrictions: [restriction]
      }).target
    ).toBe('2027-03-13')
    expect(
      findFirstMove({
        users: [createUser(), createColleague(['2027-03-11', '2027-03-13'])],
        restrictions: [restriction]
      })
    ).toEqual({
      userId: 'user',
      target: '2027-03-11',
      unmetConstraints: [],
      brokenRestrictions: [
        {
          id: 'restriction',
          kind: 'together',
          level: 'preferred',
          maxOff: 1,
          weekdays: [],
          userNames: ['Ana', 'Bruno'],
          groupName: null
        }
      ]
    })
  })

  test('Weighs a preferred restriction above the preferred constraints of the rule', () => {
    const rule = createRule({
      windowStartDay: 10,
      blockedWeekdays: [6],
      constraints: [
        { constraint: 'blocked-weekdays', level: 'preferred', position: 1 }
      ]
    })

    expect(
      findFirstMove({
        rule,
        users: [createUser(), createColleague(['2027-03-11'])],
        restrictions: [createRestriction({ level: 'preferred' })]
      })
    ).toMatchObject({
      target: '2027-03-13',
      unmetConstraints: ['blocked-weekdays'],
      brokenRestrictions: []
    })
  })

  test('Keeps the moved day off out of the weekdays forbidden to the employee', () => {
    expect(
      findFirstMove({
        users: [createUser()],
        restrictions: [
          createRestriction({
            kind: 'weekdays',
            maxOff: null,
            weekdays: [4],
            userNames: ['Ana'],
            userIds: ['user']
          })
        ]
      }).target
    ).toBe('2027-03-13')
  })

  test('Counts the days off moved before, across the employees', () => {
    const colleague = { ...createUser(), userId: 'colleague' }
    const moves = findRestMoves({
      rules: [createRule({ windowStartDay: 10 })],
      users: [createUser(), colleague],
      restrictions: [createRestriction()],
      isHoliday: () => false
    })

    expect(
      moves.map(({ userId, date, target }) => ({ userId, date, target }))
    ).toEqual([
      { userId: 'user', date: '2027-03-07', target: '2027-03-11' },
      { userId: 'colleague', date: '2027-03-07', target: '2027-03-13' },
      { userId: 'user', date: '2027-03-28', target: '2027-03-24' },
      { userId: 'colleague', date: '2027-03-28', target: '2027-03-22' }
    ])
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

const plan = (
  adjustments: Parameters<
    typeof planRestMonth
  >[0]['users'][number]['adjustments'] = []
): ReturnType<typeof planRestMonth> =>
  planRestMonth({
    rules: [createRule()],
    restrictions: [],
    isHoliday: () => false,
    initialDate: '2027-03-01',
    finalDate: '2027-03-31',
    users: [
      {
        userId: 'user',
        assignments: [createAssignment(SIX_BY_ONE)],
        adjustments
      }
    ]
  })

const kindOf = (
  days: { date: string; kind: string }[],
  date: string
): string | undefined => days.find((day) => day.date === date)?.kind

describe('planRestMonth', () => {
  test('Applies the moves to the days and keeps the schedule in the base days', () => {
    const [user] = plan().users

    expect(kindOf(user.baseDays, '2027-03-28')).toBe('off')
    expect(kindOf(user.baseDays, '2027-03-24')).toBe('work')
    expect(kindOf(user.days, '2027-03-28')).toBe('work')
    expect(kindOf(user.days, '2027-03-24')).toBe('off')
  })

  test('Ignores the saved rule adjustments, which generating the month replaces', () => {
    const [user] = plan([
      {
        date: '2027-03-10',
        kind: 'off',
        shiftAssignmentId: null,
        origin: 'rule',
        ...OFF
      }
    ]).users

    expect(kindOf(user.baseDays, '2027-03-10')).toBe('work')
    expect(kindOf(user.days, '2027-03-10')).toBe('work')
  })

  test('Is up to date only when the saved rule adjustments are the ones it generates', () => {
    const generated = [
      {
        date: '2027-03-28',
        kind: 'work' as const,
        shiftAssignmentId: 'assignment',
        origin: 'rule',
        ...OFF
      },
      {
        date: '2027-03-24',
        kind: 'off' as const,
        shiftAssignmentId: null,
        origin: 'rule',
        ...OFF
      }
    ]

    expect(plan().upToDate).toBe(false)
    expect(plan(generated).upToDate).toBe(true)
    expect(plan(generated.slice(0, 1)).upToDate).toBe(false)
  })
})
