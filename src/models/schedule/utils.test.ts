import { describe, expect, test } from 'vitest'

import type { TScheduleWithDays } from '@/infra/database/types'

import {
  getTimeFieldName,
  hasEntryOrExitAt,
  minutesToTime,
  timeToMinutes
} from './utils'

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

describe('hasEntryOrExitAt', () => {
  const schedule = {
    days: [
      {
        weekday: 1,
        entry1: timeToMinutes('07:00'),
        exit1: timeToMinutes('11:00'),
        entry2: timeToMinutes('13:00'),
        exit2: timeToMinutes('16:20'),
        entry3: null,
        exit3: null
      },
      {
        weekday: 6,
        entry1: timeToMinutes('08:00'),
        exit1: timeToMinutes('12:00'),
        entry2: null,
        exit2: null,
        entry3: null,
        exit3: null
      }
    ]
  } as TScheduleWithDays

  test('Matches the first entry or the last exit of any day', () => {
    expect(hasEntryOrExitAt(schedule, timeToMinutes('07:00'))).toBe(true)
    expect(hasEntryOrExitAt(schedule, timeToMinutes('16:20'))).toBe(true)
    expect(hasEntryOrExitAt(schedule, timeToMinutes('12:00'))).toBe(true)
  })

  test('Ignores the times around the lunch', () => {
    expect(hasEntryOrExitAt(schedule, timeToMinutes('11:00'))).toBe(false)
    expect(hasEntryOrExitAt(schedule, timeToMinutes('13:00'))).toBe(false)
  })

  test('Matches no time without a schedule', () => {
    expect(hasEntryOrExitAt(null, timeToMinutes('07:00'))).toBe(false)
  })
})
