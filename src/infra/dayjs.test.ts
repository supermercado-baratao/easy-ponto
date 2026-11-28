import { describe, expect, test } from 'vitest'

import { toWallClock } from './dayjs'

describe('toWallClock', () => {
  test('Reads an instant in the store time zone', () => {
    expect(
      toWallClock(new Date('2026-12-02T01:30:00.000Z')).format(
        'YYYY-MM-DD HH:mm'
      )
    ).toBe('2026-12-01 22:30')
  })
})
