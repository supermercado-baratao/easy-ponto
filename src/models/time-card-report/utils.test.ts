import { describe, expect, test } from 'vitest'

import { getWeekdayTimeFieldName } from './utils'

describe('getWeekdayTimeFieldName', () => {
  test('Joins the weekday and the time field', () => {
    expect(getWeekdayTimeFieldName('monday', 'entry1')).toBe('mondayEntry1')
    expect(getWeekdayTimeFieldName('sunday', 'exit3')).toBe('sundayExit3')
  })
})
