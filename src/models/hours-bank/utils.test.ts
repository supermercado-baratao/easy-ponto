import { describe, expect, test } from 'vitest'

import type { TJourney, TJourneyDay } from '@/models/journey/types'

import type { THoursBankRow } from './types'
import {
  calculateBalance,
  findCloseIssue,
  sortRows,
  sumJourneys
} from './utils'

const day = (journey: Partial<TJourney>): TJourneyDay =>
  ({
    journey: {
      absence: 0,
      lateness: 0,
      dayOff: 0,
      overtime60: 0,
      overtime100: 0,
      ...journey
    }
  }) as TJourneyDay

const row = (name: string, balance: number): THoursBankRow =>
  ({ name, balance }) as THoursBankRow

describe('sumJourneys', () => {
  test('Sums each total of the days', () => {
    expect(
      sumJourneys([
        day({ absence: 440, overtime100: 60 }),
        day({ lateness: 15, overtime60: 30 }),
        day({ dayOff: 200, overtime60: 10 })
      ])
    ).toEqual({
      absence: 440,
      lateness: 15,
      dayOff: 200,
      overtime60: 40,
      overtime100: 60
    })
  })
})

describe('calculateBalance', () => {
  test('Adds the overtime and the adjustments and discounts the absences, lateness and days off', () => {
    expect(
      calculateBalance({
        previousBalance: 100,
        absence: 440,
        lateness: 15,
        dayOff: 200,
        overtime60: 300,
        overtime100: 120,
        adjustment: -30
      })
    ).toBe(100 + 300 + 120 - 30 - 440 - 15 - 200)
  })
})

describe('sortRows', () => {
  const rows = [row('Bruno', -60), row('Carla', 120), row('Ana', 120)]

  test('Orders by the balance, from the highest, then by the name', () => {
    expect(sortRows(rows, 'balance').map(({ name }) => name)).toEqual([
      'Ana',
      'Carla',
      'Bruno'
    ])
  })

  test('Orders by the name', () => {
    expect(sortRows(rows, 'name').map(({ name }) => name)).toEqual([
      'Ana',
      'Bruno',
      'Carla'
    ])
  })
})

describe('findCloseIssue', () => {
  const today = '2026-11-13'

  test('Allows any start when no period was closed', () => {
    expect(
      findCloseIssue({
        period: { initialDate: '2026-10-01', finalDate: '2026-10-31' },
        lastClosing: null,
        today
      })
    ).toBeNull()
  })

  test('Requires the period to start the day after the last closing', () => {
    const lastClosing = { endDate: '2026-10-31' }
    expect(
      findCloseIssue({
        period: { initialDate: '2026-11-01', finalDate: '2026-11-13' },
        lastClosing,
        today
      })
    ).toBeNull()
    expect(
      findCloseIssue({
        period: { initialDate: '2026-11-02', finalDate: '2026-11-13' },
        lastClosing,
        today
      })
    ).toBe(
      'O período deve começar em 01/11/2026, o dia seguinte ao último fechamento.'
    )
  })

  test('Rejects a period that ends after today', () => {
    expect(
      findCloseIssue({
        period: { initialDate: '2026-11-01', finalDate: '2026-11-30' },
        lastClosing: null,
        today
      })
    ).toBe('O período só pode ser fechado até hoje.')
  })
})
