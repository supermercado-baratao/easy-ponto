import { describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'

import type { TVacationPlanRow } from './types'
import { canChangeMonth, getMonthPeriod, groupByMonth } from './utils'

const row = (name: string, month?: number): TVacationPlanRow =>
  ({
    user: { id: name, name } as User,
    plan: month ? { month } : null
  }) as TVacationPlanRow

describe('getMonthPeriod', () => {
  test('Returns the first and the last day of the month', () => {
    expect(getMonthPeriod(2027, 2)).toEqual({
      startDate: '2027-02-01',
      endDate: '2027-02-28'
    })
    expect(getMonthPeriod(2028, 2).endDate).toBe('2028-02-29')
    expect(getMonthPeriod(2027, 12)).toEqual({
      startDate: '2027-12-01',
      endDate: '2027-12-31'
    })
  })
})

describe('groupByMonth', () => {
  test('Lists the employees of each month of the year', () => {
    const months = groupByMonth([
      row('Ana', 7),
      row('Bruno'),
      row('Carla', 1),
      row('Davi', 7)
    ])
    expect(months).toHaveLength(12)
    expect(months[0].users.map(({ name }) => name)).toEqual(['Carla'])
    expect(months[6].users.map(({ name }) => name)).toEqual(['Ana', 'Davi'])
    expect(months[1].users).toEqual([])
  })
})

describe('canChangeMonth', () => {
  test('Allows any month while the vacation is not registered', () => {
    expect(canChangeMonth(null, 3)).toBe(true)
    expect(canChangeMonth({ month: 7, justificationId: null }, 3)).toBe(true)
    expect(canChangeMonth({ month: 7, justificationId: null }, null)).toBe(true)
  })

  test('Keeps the month of a registered vacation', () => {
    const plan = { month: 7, justificationId: 'justification' }
    expect(canChangeMonth(plan, 7)).toBe(true)
    expect(canChangeMonth(plan, 8)).toBe(false)
    expect(canChangeMonth(plan, null)).toBe(false)
  })
})
