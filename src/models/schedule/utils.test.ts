import { describe, expect, test } from 'vitest'

import { getTimeFieldName, minutesToTime, timeToMinutes } from './utils'

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

describe('getTimeFieldName', () => {
  test('Joins the weekday and the time field', () => {
    expect(getTimeFieldName('monday', 'entry1')).toBe('mondayEntry1')
    expect(getTimeFieldName('sunday', 'exit3')).toBe('sundayExit3')
  })
})
