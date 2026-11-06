import { describe, expect, test } from 'vitest'

import type { PunchRecord } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

import { groupByDay, resolvePeriod } from './utils'

const now = dayjs('2026-03-15T10:00:00Z')

const createRecord = (datetime: string, nsr: number | null = 1): PunchRecord =>
  ({ pis: '012345678901', datetime: new Date(datetime), nsr }) as PunchRecord

describe('resolvePeriod', () => {
  test('Defaults to the first day of the month until today', () => {
    expect(resolvePeriod({}, now)).toEqual({
      initialDate: '2026-03-01',
      finalDate: '2026-03-15'
    })
  })

  test('Keeps the given dates', () => {
    expect(
      resolvePeriod({ initialDate: '2026-01-10', finalDate: '2026-02-20' }, now)
    ).toEqual({ initialDate: '2026-01-10', finalDate: '2026-02-20' })
  })

  test('Replaces only the invalid dates with the default', () => {
    expect(
      resolvePeriod({ initialDate: '2026-02-31', finalDate: '2026-03-10' }, now)
    ).toEqual({ initialDate: '2026-03-01', finalDate: '2026-03-10' })
    expect(
      resolvePeriod({ initialDate: '2026-03-05', finalDate: 'hoje' }, now)
    ).toEqual({ initialDate: '2026-03-05', finalDate: '2026-03-15' })
  })

  test('Orders a period given backwards', () => {
    expect(
      resolvePeriod({ initialDate: '2026-03-10', finalDate: '2026-03-02' }, now)
    ).toEqual({ initialDate: '2026-03-02', finalDate: '2026-03-10' })
  })
})

describe('groupByDay', () => {
  test('Returns one day per date of the period, with the records in order', () => {
    const late = createRecord('2026-03-02T12:00:00Z')
    const early = createRecord('2026-03-02T08:00:00Z', null)
    const nextDay = createRecord('2026-03-03T23:59:00Z')

    const days = groupByDay([late, nextDay, early], {
      initialDate: '2026-03-01',
      finalDate: '2026-03-03'
    })

    expect(days).toEqual([
      { date: '2026-03-01', punchRecords: [] },
      { date: '2026-03-02', punchRecords: [early, late] },
      { date: '2026-03-03', punchRecords: [nextDay] }
    ])
  })

  test('Includes every date across the end of the month', () => {
    const days = groupByDay([], {
      initialDate: '2026-02-27',
      finalDate: '2026-03-01'
    })

    expect(days.map(({ date }) => date)).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01'
    ])
  })
})
