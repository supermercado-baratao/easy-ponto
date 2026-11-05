import { describe, expect, test } from 'vitest'

import { ddMMYYYYToDate } from './file'

describe('ddMMYYYYToDate', () => {
  test.each([
    ['15/08/2025', '2025-08-15'],
    ['15/01/2025', '2025-01-15'],
    ['31/12/2025', '2025-12-31'],
    ['31/03/2026', '2026-03-31'],
    ['29/02/2024', '2024-02-29']
  ])('converts %s keeping day, month and year', (date, expected) => {
    expect(ddMMYYYYToDate(date).toISOString()).toBe(`${expected}T00:00:00.000Z`)
  })
})
