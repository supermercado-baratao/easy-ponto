import { describe, expect, test } from 'vitest'

import { dayjs } from '@/infra/dayjs'
import type { TRestRestrictionInput } from '@/models/rest-restriction/utils'
import type { TRestMove } from '@/models/rest-rule/utils'
import type { TResolvedDay, TShiftPair } from '@/models/shift-assignment/utils'

import {
  buildScheduleReport,
  getReportMonths,
  type TReportMonthInput,
  type TReportUser
} from './utils'

const DAY: TShiftPair[] = [
  { entry: 8 * 60, exit: 12 * 60 },
  { entry: 13 * 60, exit: 17 * 60 }
]

// Monday, March 1, 2027 to Sunday, March 7
const INITIAL_DATE = '2027-03-01'
const FINAL_DATE = '2027-03-07'

const createDays = ({
  off = [],
  adjusted = [],
  pairs = DAY
}: {
  off?: string[]
  adjusted?: string[]
  pairs?: TShiftPair[]
} = {}): TResolvedDay[] =>
  Array.from({ length: 7 }, (_, index) => {
    const date = dayjs(INITIAL_DATE).add(index, 'day').format('YYYY-MM-DD')
    const isOff = off.includes(date)
    return {
      date,
      kind: isOff ? 'off' : 'work',
      pairs: isOff ? [] : pairs,
      adjusted: adjusted.includes(date)
    }
  })

const UNASSIGNED: TResolvedDay[] = createDays().map((day) => ({
  ...day,
  kind: 'unassigned',
  pairs: []
}))

const createUser = (id: string, groupIds: string[] = []): TReportUser => ({
  id,
  name: `Funcionário ${id}`,
  groupIds,
  shiftPatternNames: ['6x1']
})

const createMove = (move: Partial<TRestMove>): TRestMove => ({
  userId: 'a',
  ruleId: 'rule',
  ruleName: 'Folga na janela',
  shiftAssignmentId: 'assignment',
  date: '2027-03-07',
  reason: 'outside-window',
  target: '2027-03-03',
  unmetConstraints: [],
  brokenRestrictions: [],
  ...move
})

const createMonth = ({
  users,
  moves = [],
  upToDate = true
}: {
  users: TReportMonthInput['users']
  moves?: TRestMove[]
  upToDate?: boolean
}): TReportMonthInput => ({
  month: '2027-03',
  initialDate: INITIAL_DATE,
  finalDate: FINAL_DATE,
  users,
  moves,
  upToDate
})

const createRestriction = (
  restriction: Partial<TRestRestrictionInput>
): TRestRestrictionInput => ({
  id: 'restriction',
  kind: 'together',
  level: 'preferred',
  maxOff: 1,
  weekdays: [],
  userNames: [],
  groupName: null,
  userIds: ['a', 'b'],
  ...restriction
})

const build = ({
  months,
  users = [createUser('a'), createUser('b')],
  groups = [],
  rules = [],
  restrictions = [],
  holidays = [],
  limit = null
}: {
  months: TReportMonthInput[]
  users?: TReportUser[]
  groups?: { id: string; name: string; parentId: string | null }[]
  rules?: { windowStartDay: number; windowEndDay: number }[]
  restrictions?: TRestRestrictionInput[]
  holidays?: string[]
  limit?: number | null
}): ReturnType<typeof buildScheduleReport> =>
  buildScheduleReport({
    months,
    users,
    groups,
    rules,
    restrictions,
    isHoliday: (date) => holidays.includes(date),
    limit
  })

describe('getReportMonths', () => {
  test('Lists every month of the period, across the turn of the year', () => {
    expect(getReportMonths('2027-11', '2028-02')).toEqual([
      '2027-11',
      '2027-12',
      '2028-01',
      '2028-02'
    ])
  })
})

describe('buildScheduleReport', () => {
  test('Leaves the employees without a schedule in the period out and points them out', () => {
    const days = createDays({ off: ['2027-03-07'] })
    const report = build({
      months: [
        createMonth({
          users: [
            { userId: 'a', baseDays: days, days },
            { userId: 'b', baseDays: UNASSIGNED, days: UNASSIGNED }
          ]
        })
      ]
    })

    expect(report.indicators.employees).toBe(1)
    expect(report.employees.map(({ userId }) => userId)).toEqual(['a'])
    expect(report.attentionPoints).toEqual([
      { kind: 'without-schedule', userName: 'Funcionário b' }
    ])
  })

  test('Takes the worst day from the planned days, the earliest one on a tie', () => {
    const a = createDays({ off: ['2027-03-03', '2027-03-07'] })
    const b = createDays({ off: ['2027-03-03', '2027-03-07'] })
    const report = build({
      months: [
        createMonth({
          users: [
            { userId: 'a', baseDays: a, days: a },
            { userId: 'b', baseDays: b, days: b }
          ]
        })
      ]
    })

    expect(report.indicators.worstDay).toEqual({ date: '2027-03-03', off: 2 })
  })

  test('Averages the days off of the cycle by weekday, leaving the adjusted ones out', () => {
    const a = createDays({ off: ['2027-03-07'] })
    const b = createDays({
      off: ['2027-03-06', '2027-03-07'],
      adjusted: ['2027-03-06']
    })
    const report = build({
      months: [
        createMonth({
          users: [
            { userId: 'a', baseDays: a, days: a },
            { userId: 'b', baseDays: b, days: b }
          ]
        })
      ]
    })

    const [general] = report.rests
    expect(general.weekdays.find(({ weekday }) => weekday === 0)).toEqual({
      weekday: 0,
      average: 2
    })
    expect(general.weekdays.find(({ weekday }) => weekday === 6)).toEqual({
      weekday: 6,
      average: 0
    })
  })

  test('Counts the hours of a shift past midnight in the next day and leaves the holidays out', () => {
    const night = createDays({
      pairs: [{ entry: 22 * 60, exit: 26 * 60 }]
    })
    const report = build({
      users: [createUser('a')],
      holidays: ['2027-03-02'],
      months: [
        createMonth({ users: [{ userId: 'a', baseDays: night, days: night }] })
      ]
    })

    expect(report.hours).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23
    ])
    const [{ rows }] = report.presence
    const monday = rows.find(({ weekday }) => weekday === 1)!
    const tuesday = rows.find(({ weekday }) => weekday === 2)!
    const wednesday = rows.find(({ weekday }) => weekday === 3)!
    // Sunday's shift reaches the Monday after the period, so only Monday's own night counts
    expect(monday.values[22]).toBe(1)
    expect(monday.values[1]).toBe(0)
    expect(tuesday.values).toEqual(Array.from({ length: 24 }, () => 0))
    // The holiday's shift isn't counted, so Wednesday's early hours are empty
    expect(wednesday.values[1]).toBe(0)
    expect(wednesday.values[23]).toBe(1)
  })

  test('Shows only the hours from the first to the last one worked', () => {
    const days = createDays()
    const report = build({
      users: [createUser('a')],
      months: [createMonth({ users: [{ userId: 'a', baseDays: days, days }] })]
    })

    expect(report.hours).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16])
    const [{ rows }] = report.presence
    expect(rows[0].values).toEqual([1, 1, 1, 1, 0, 1, 1, 1, 1])
  })

  test('Summarizes each month by the planned days off, the window and the limit', () => {
    const a = createDays({ off: ['2027-03-02', '2027-03-06'] })
    const b = createDays({ off: ['2027-03-06', '2027-03-07'] })
    const month = createMonth({
      upToDate: false,
      users: [
        { userId: 'a', baseDays: a, days: a },
        { userId: 'b', baseDays: b, days: b }
      ]
    })

    const [summary] = build({
      months: [month],
      rules: [{ windowStartDay: 5, windowEndDay: 7 }],
      limit: 1
    }).months
    expect(summary).toEqual({
      month: '2027-03',
      total: 4,
      windowAverage: 1,
      worstDay: { date: '2027-03-06', off: 2 },
      daysAboveLimit: 1,
      upToDate: false
    })
    expect(build({ months: [month] }).months[0]).toMatchObject({
      windowAverage: null,
      daysAboveLimit: null
    })
  })

  test('Counts the members of the groups inside a group in its numbers', () => {
    const a = createDays({ off: ['2027-03-04'] })
    const b = createDays({ off: ['2027-03-05'] })
    const report = build({
      users: [createUser('a', ['store']), createUser('b', ['bakery'])],
      groups: [
        { id: 'store', name: 'Loja', parentId: null },
        { id: 'bakery', name: 'Padaria', parentId: 'store' }
      ],
      months: [
        createMonth({
          users: [
            { userId: 'a', baseDays: a, days: a },
            { userId: 'b', baseDays: b, days: b }
          ]
        })
      ]
    })

    expect(report.groupWorstDays).toEqual([
      {
        groupId: 'store',
        name: 'Loja',
        members: 2,
        worstDay: { date: '2027-03-04', off: 1 }
      },
      {
        groupId: 'bakery',
        name: 'Loja › Padaria',
        members: 1,
        worstDay: { date: '2027-03-05', off: 1 }
      }
    ])
    expect(report.attentionPoints).toEqual([
      { kind: 'single-member-group', groupName: 'Loja › Padaria' }
    ])
  })

  test("Counts each employee's moved days off and the hours they change", () => {
    const baseDays = createDays({ off: ['2027-03-01', '2027-03-07'] })
    // The day off on Sunday went to Wednesday, and the one on Monday, a holiday, to Thursday
    const days = createDays({
      off: ['2027-03-01', '2027-03-03', '2027-03-04'],
      adjusted: ['2027-03-01', '2027-03-03', '2027-03-04', '2027-03-07']
    })
    const report = build({
      users: [createUser('a')],
      holidays: ['2027-03-01'],
      months: [
        createMonth({
          users: [{ userId: 'a', baseDays, days }],
          moves: [
            createMove({ date: '2027-03-07', target: '2027-03-03' }),
            createMove({
              date: '2027-03-01',
              reason: 'holiday',
              target: '2027-03-04'
            }),
            createMove({ date: '2027-03-02', target: null })
          ]
        })
      ]
    })

    expect(report.employees[0]).toMatchObject({
      cycleRestWeekdays: [1, 0],
      cycleRests: 2,
      movedRests: 2,
      postponedRests: 1,
      advancedRests: 1,
      unmovedRests: 1,
      balance: -480
    })
    expect(report.indicators).toMatchObject({ movedRests: 2, unmovedRests: 1 })
    expect(report.attentionPoints).toEqual([
      {
        kind: 'unmoved-rest',
        userName: 'Funcionário a',
        date: '2027-03-02',
        ruleName: 'Folga na janela'
      }
    ])
  })

  test('Lists the preferred rules not met with their days, and the required restrictions broken as attention points', () => {
    const a = createDays({ off: ['2027-03-03', '2027-03-06'] })
    const b = createDays({ off: ['2027-03-03', '2027-03-06'] })
    const report = build({
      restrictions: [
        createRestriction({ id: 'together' }),
        createRestriction({
          id: 'saturday',
          kind: 'weekdays',
          level: 'required',
          maxOff: null,
          weekdays: [6],
          userIds: ['a']
        })
      ],
      months: [
        createMonth({
          upToDate: false,
          users: [
            { userId: 'a', baseDays: a, days: a },
            { userId: 'b', baseDays: b, days: b }
          ],
          moves: [
            createMove({
              target: '2027-03-03',
              unmetConstraints: ['same-load']
            }),
            createMove({
              userId: 'b',
              target: '2027-03-06',
              unmetConstraints: ['same-load']
            })
          ]
        })
      ]
    })

    expect(report.unmetRules).toEqual([
      {
        kind: 'constraint',
        ruleName: 'Folga na janela',
        constraint: 'same-load',
        dates: ['2027-03-03', '2027-03-06']
      },
      {
        kind: 'restriction',
        restriction: expect.objectContaining({ id: 'together' }),
        dates: ['2027-03-03', '2027-03-06']
      }
    ])
    expect(report.attentionPoints).toEqual([
      { kind: 'outdated-month', month: '2027-03' },
      {
        kind: 'required-restriction-break',
        restriction: expect.objectContaining({ id: 'saturday' }),
        date: '2027-03-06'
      }
    ])
  })

  test('Counts the employees of each shift pattern', () => {
    const days = createDays()
    const report = build({
      users: [
        createUser('a'),
        { ...createUser('b'), shiftPatternNames: ['5x2', '6x1'] }
      ],
      months: [
        createMonth({
          users: [
            { userId: 'a', baseDays: days, days },
            { userId: 'b', baseDays: days, days }
          ]
        })
      ]
    })

    expect(report.shiftPatterns).toEqual([
      { name: '5x2', employees: 1 },
      { name: '6x1', employees: 2 }
    ])
  })
})
