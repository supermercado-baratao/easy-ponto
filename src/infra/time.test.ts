import { describe, expect, test } from 'vitest'

import { minutesToTime, timeToMinutes } from './time'

describe('timeToMinutes', () => {
  test('Counts the minutes since midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('07:20')).toBe(440)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
})

describe('minutesToTime', () => {
  test('Formats the minutes since midnight as hh:mm', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(440)).toBe('07:20')
    expect(minutesToTime(1439)).toBe('23:59')
  })
})
