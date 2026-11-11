import { describe, expect, test } from 'vitest'

import {
  findConflictingHoliday,
  findHoliday,
  getEasterDate,
  getHolidayDateInYear,
  getNationalHolidays
} from './utils'

const christmas = { date: '2026-12-25', recurring: true }
const goodFriday = { date: '2026-04-03', recurring: false }

describe('findHoliday', () => {
  test('Finds a recurring holiday in any year', () => {
    expect(findHoliday('2026-12-25', [christmas])).toBe(christmas)
    expect(findHoliday('2030-12-25', [christmas])).toBe(christmas)
    expect(findHoliday('2020-12-25', [christmas])).toBe(christmas)
  })

  test('Finds a one-off holiday only on its date', () => {
    expect(findHoliday('2026-04-03', [goodFriday])).toBe(goodFriday)
    expect(findHoliday('2027-04-03', [goodFriday])).toBeUndefined()
  })

  test('Finds no holiday on a regular day', () => {
    expect(findHoliday('2026-12-24', [christmas, goodFriday])).toBeUndefined()
  })
})

describe('getHolidayDateInYear', () => {
  test('Moves a recurring holiday to the given year', () => {
    expect(getHolidayDateInYear(christmas, 2030)).toBe('2030-12-25')
  })

  test('Keeps a one-off holiday only in its own year', () => {
    expect(getHolidayDateInYear(goodFriday, 2026)).toBe('2026-04-03')
    expect(getHolidayDateInYear(goodFriday, 2027)).toBeNull()
  })
})

describe('findConflictingHoliday', () => {
  test('Conflicts a recurring holiday with any year on the same day', () => {
    expect(
      findConflictingHoliday({ date: '2030-12-25', recurring: false }, [
        christmas
      ])
    ).toBe(christmas)
    expect(
      findConflictingHoliday({ date: '2027-04-03', recurring: true }, [
        goodFriday
      ])
    ).toBe(goodFriday)
  })

  test('Conflicts two one-off holidays only on the same date', () => {
    expect(
      findConflictingHoliday({ date: '2026-04-03', recurring: false }, [
        goodFriday
      ])
    ).toBe(goodFriday)
    expect(
      findConflictingHoliday({ date: '2027-04-03', recurring: false }, [
        goodFriday
      ])
    ).toBeUndefined()
  })
})

describe('getEasterDate', () => {
  test.each([
    [2024, '2024-03-31'],
    [2025, '2025-04-20'],
    [2026, '2026-04-05'],
    [2027, '2027-03-28'],
    [2038, '2038-04-25']
  ])('Returns the Easter of %i', (year, date) => {
    expect(getEasterDate(year)).toBe(date)
  })
})

describe('getNationalHolidays', () => {
  test('Returns the fixed holidays as recurring and the Easter-based ones for the year', () => {
    expect(getNationalHolidays(2026)).toEqual([
      {
        date: '2026-01-01',
        name: 'Confraternização Universal',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-02-16',
        name: 'Carnaval',
        scope: 'municipal',
        recurring: false
      },
      {
        date: '2026-02-17',
        name: 'Carnaval',
        scope: 'municipal',
        recurring: false
      },
      {
        date: '2026-04-03',
        name: 'Paixão de Cristo',
        scope: 'national',
        recurring: false
      },
      {
        date: '2026-04-21',
        name: 'Tiradentes',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-05-01',
        name: 'Dia do Trabalho',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-06-04',
        name: 'Corpus Christi',
        scope: 'municipal',
        recurring: false
      },
      {
        date: '2026-09-07',
        name: 'Independência do Brasil',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-10-12',
        name: 'Nossa Senhora Aparecida',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-11-02',
        name: 'Finados',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-11-15',
        name: 'Proclamação da República',
        scope: 'national',
        recurring: true
      },
      {
        date: '2026-11-20',
        name: 'Dia Nacional de Zumbi e da Consciência Negra',
        scope: 'national',
        recurring: true
      },
      { date: '2026-12-25', name: 'Natal', scope: 'national', recurring: true }
    ])
  })
})
