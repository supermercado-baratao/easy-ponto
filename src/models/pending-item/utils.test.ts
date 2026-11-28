import { describe, expect, test } from 'vitest'

import type { TResolvedDay } from '@/models/shift-assignment/utils'

import type { TPendingItemContext } from './types'
import { detectPendingItems, isDismissible } from './utils'

const TODAY = '2026-12-01'

const ana = { id: 'ana', name: 'Ana' }
const bruno = { id: 'bruno', name: 'Bruno' }

const day = (
  date: string,
  kind: TResolvedDay['kind'],
  pairs: TResolvedDay['pairs'] = []
): TResolvedDay => ({ date, kind, pairs, adjusted: false })

const createContext = (
  context: Partial<TPendingItemContext> = {}
): TPendingItemContext => ({
  today: TODAY,
  company: { deviceCredentialsId: 'device', cpfCnpj: '12345678000190' },
  overtimeBands: [
    { dayKind: 'workday' },
    { dayKind: 'day-off' },
    { dayKind: 'holiday' }
  ],
  users: [],
  shiftDays: [],
  limits: { maxLunch: 120, maxDailyJourney: 600, maxContinuousWork: 360 },
  restRules: [],
  restDays: [],
  restRestrictions: [],
  isHoliday: () => false,
  ...context
})

describe('detectPendingItems', () => {
  test('Finds nothing in a configured company with no employees', () => {
    expect(detectPendingItems(createContext())).toEqual([])
  })

  test('Lists each missing setup step of the company', () => {
    expect(
      detectPendingItems(
        createContext({
          company: { deviceCredentialsId: null, cpfCnpj: null },
          overtimeBands: []
        })
      )
    ).toEqual([
      { key: 'company-setup:device', type: 'company-setup', step: 'device' },
      { key: 'company-setup:company', type: 'company-setup', step: 'company' },
      {
        key: 'company-setup:overtime-bands',
        type: 'company-setup',
        step: 'overtime-bands'
      }
    ])
  })

  test('Lists the employees without a schedule in effect today', () => {
    const shiftDays = [
      { userId: 'ana', days: [day(TODAY, 'unassigned')] },
      { userId: 'bruno', days: [day(TODAY, 'off')] }
    ]
    expect(
      detectPendingItems(createContext({ users: [ana, bruno], shiftDays }))
    ).toEqual([
      {
        key: 'user-without-schedule:ana',
        type: 'user-without-schedule',
        user: ana
      }
    ])
  })

  test('Counts an employee without shift days as without a schedule', () => {
    expect(
      detectPendingItems(createContext({ users: [ana] })).map(({ key }) => key)
    ).toEqual(['user-without-schedule:ana'])
  })

  test('Lists each schedule alert of each day, by date', () => {
    const longJourney = [{ entry: 420, exit: 1140 }]
    const longLunch = [
      { entry: 480, exit: 720 },
      { entry: 900, exit: 1080 }
    ]
    const items = detectPendingItems(
      createContext({
        users: [ana, bruno],
        shiftDays: [
          {
            userId: 'ana',
            days: [
              day(TODAY, 'work', longLunch),
              day('2026-12-02', 'work', longJourney)
            ]
          },
          {
            userId: 'bruno',
            days: [day(TODAY, 'off'), day('2026-12-02', 'work', longLunch)]
          }
        ]
      })
    )
    expect(items.map(({ key }) => key)).toEqual([
      `schedule-alert:long-lunch:ana:${TODAY}`,
      'schedule-alert:long-journey:ana:2026-12-02',
      'schedule-alert:long-continuous-work:ana:2026-12-02',
      'schedule-alert:long-lunch:bruno:2026-12-02'
    ])
    expect(items[0]).toEqual({
      key: `schedule-alert:long-lunch:ana:${TODAY}`,
      type: 'schedule-alert',
      user: ana,
      date: TODAY,
      alert: 'long-lunch'
    })
  })

  test('Keeps the setup first, then the employees without a schedule and the schedule alerts', () => {
    const items = detectPendingItems(
      createContext({
        company: { deviceCredentialsId: null, cpfCnpj: '12345678000190' },
        users: [ana, bruno],
        shiftDays: [
          {
            userId: 'ana',
            days: [day(TODAY, 'work', [{ entry: 420, exit: 1140 }])]
          }
        ]
      })
    )
    expect([...new Set(items.map(({ type }) => type))]).toEqual([
      'company-setup',
      'user-without-schedule',
      'schedule-alert'
    ])
  })
})

describe('detectUnmovedRests', () => {
  const assignment = {
    id: 'assignment',
    shiftPatternId: 'pattern',
    startDate: '2026-12-01',
    endDate: null,
    cycleStartDay: 1,
    shiftPattern: { versions: [] }
  }
  const restRule = {
    id: 'rule',
    name: 'Folga na janela',
    windowStartDay: 5,
    windowEndDay: 25,
    distances: [2],
    blockedWeekdays: [],
    holidayRest: 'window',
    shiftPatternIds: ['pattern'],
    constraints: []
  }

  test('Lists the days off a rule moves that have no adjustment, for the active employees only', () => {
    const items = detectPendingItems(
      createContext({
        users: [ana],
        restRules: [restRule],
        restDays: [
          {
            userId: 'ana',
            assignments: [assignment],
            days: [
              day('2026-12-03', 'off'),
              day('2026-12-13', 'off'),
              { ...day('2026-12-27', 'off'), adjusted: true }
            ]
          },
          {
            userId: 'bruno',
            assignments: [assignment],
            days: [day('2026-12-03', 'off')]
          }
        ]
      })
    ).filter(({ type }) => type === 'unmoved-rest')

    expect(items).toEqual([
      {
        key: 'unmoved-rest:ana:2026-12-03',
        type: 'unmoved-rest',
        user: ana,
        date: '2026-12-03',
        ruleName: 'Folga na janela'
      }
    ])
  })
})

describe('detectRestRestrictionBreaks', () => {
  test('Gathers in one item everyone off on a day over a limit, for the active employees only', () => {
    const carla = { id: 'carla', name: 'Carla' }
    const items = detectPendingItems(
      createContext({
        users: [bruno, ana],
        restRestrictions: [
          {
            id: 'restriction',
            kind: 'together',
            level: 'required',
            maxOff: 1,
            weekdays: [],
            userNames: ['Ana', 'Bruno', 'Carla'],
            groupName: null,
            userIds: ['ana', 'bruno', carla.id]
          }
        ],
        restDays: [ana, bruno, carla].map(({ id }) => ({
          userId: id,
          assignments: [],
          days: [day('2026-12-03', 'off'), day('2026-12-04', 'work')]
        }))
      })
    ).filter(({ type }) => type === 'rest-restriction-break')

    expect(items).toEqual([
      {
        key: 'rest-restriction-break:restriction:2026-12-03',
        type: 'rest-restriction-break',
        users: [ana, bruno],
        date: '2026-12-03',
        restriction: {
          id: 'restriction',
          kind: 'together',
          level: 'required',
          maxOff: 1,
          weekdays: [],
          userNames: ['Ana', 'Bruno', 'Carla'],
          groupName: null
        }
      }
    ])
  })
})

describe('isDismissible', () => {
  test('Keeps the company setup until it is done', () => {
    expect(isDismissible({ type: 'company-setup' })).toBe(false)
    expect(isDismissible({ type: 'user-without-schedule' })).toBe(true)
    expect(isDismissible({ type: 'schedule-alert' })).toBe(true)
    expect(isDismissible({ type: 'unmoved-rest' })).toBe(true)
    expect(isDismissible({ type: 'rest-restriction-break' })).toBe(true)
  })
})
