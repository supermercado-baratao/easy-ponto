import { describe, expect, test } from 'vitest'

import type { Justification } from '@/infra/database/types'

import { findOverlappingJustification } from './utils'

type TPeriod = Pick<
  Justification,
  'startDate' | 'endDate' | 'startTime' | 'endTime'
>

const DATE = '2026-11-10'

const wholeDays = (startDate: string, endDate: string): TPeriod => ({
  startDate,
  endDate,
  startTime: null,
  endTime: null
})

const timed = (startTime: number, endTime: number): TPeriod => ({
  startDate: DATE,
  endDate: DATE,
  startTime,
  endTime
})

describe('findOverlappingJustification', () => {
  test('Finds a justification that shares a day', () => {
    const vacation = wholeDays('2026-11-10', '2026-11-20')
    expect(
      findOverlappingJustification(wholeDays('2026-11-20', '2026-11-21'), [
        vacation
      ])
    ).toBe(vacation)
    expect(
      findOverlappingJustification(wholeDays('2026-11-21', '2026-11-22'), [
        vacation
      ])
    ).toBeUndefined()
  })

  test('Treats a whole-day justification as overlapping any time of the day', () => {
    const shift = timed(840, 940)
    expect(
      findOverlappingJustification(wholeDays('2026-11-10', '2026-11-10'), [
        shift
      ])
    ).toBe(shift)
    expect(
      findOverlappingJustification(shift, [
        wholeDays('2026-11-09', '2026-11-11')
      ])
    ).toBeDefined()
  })

  test('Allows two times of the same day that do not cross', () => {
    const morning = timed(420, 660)
    expect(
      findOverlappingJustification(timed(660, 980), [morning])
    ).toBeUndefined()
    expect(findOverlappingJustification(timed(600, 980), [morning])).toBe(
      morning
    )
  })
})
