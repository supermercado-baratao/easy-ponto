import { describe, expect, test } from 'vitest'

import {
  findConflictingHoliday,
  findHoliday,
  getEasterDate,
  getHolidayDateInYear,
  getNationalHolidays
} from './utils'

const rule = {
  date: null,
  easterOffset: null,
  firstYear: null,
  lastYear: null
}
const christmas = { ...rule, recurrence: 'yearly' as const, date: '2026-12-25' }
const tiradentes = {
  ...rule,
  recurrence: 'yearly' as const,
  date: '2026-04-21'
}
const goodFriday = { ...rule, recurrence: 'easter' as const, easterOffset: -2 }
const localHoliday = {
  ...rule,
  recurrence: 'once' as const,
  date: '2026-04-03'
}
const cityFestival = {
  ...rule,
  recurrence: 'yearly' as const,
  date: '2026-08-15',
  firstYear: 2020,
  lastYear: 2026
}

describe('getHolidayDateInYear', () => {
  test('Moves a fixed holiday to the given year', () => {
    expect(getHolidayDateInYear(christmas, 2030)).toBe('2030-12-25')
  })

  test('Calculates a moveable holiday from the Easter of each year', () => {
    expect(getHolidayDateInYear(goodFriday, 2026)).toBe('2026-04-03')
    expect(getHolidayDateInYear(goodFriday, 2027)).toBe('2027-03-26')
    expect(
      getHolidayDateInYear({ ...goodFriday, easterOffset: 48 }, 2026)
    ).toBe('2026-05-23')
  })

  test('Keeps a one-off holiday only in its own year', () => {
    expect(getHolidayDateInYear(localHoliday, 2026)).toBe('2026-04-03')
    expect(getHolidayDateInYear(localHoliday, 2027)).toBeNull()
  })

  test('Returns a holiday only in the years it is valid', () => {
    expect(getHolidayDateInYear(cityFestival, 2019)).toBeNull()
    expect(getHolidayDateInYear(cityFestival, 2020)).toBe('2020-08-15')
    expect(getHolidayDateInYear(cityFestival, 2026)).toBe('2026-08-15')
    expect(getHolidayDateInYear(cityFestival, 2027)).toBeNull()
  })
})

describe('findHoliday', () => {
  test('Finds a fixed and a moveable holiday in any year', () => {
    expect(findHoliday('2020-12-25', [christmas, goodFriday])).toBe(christmas)
    expect(findHoliday('2027-03-26', [christmas, goodFriday])).toBe(goodFriday)
  })

  test('Finds no holiday on a regular day or out of its years', () => {
    expect(
      findHoliday('2027-04-03', [goodFriday, localHoliday])
    ).toBeUndefined()
    expect(findHoliday('2027-08-15', [cityFestival])).toBeUndefined()
  })
})

describe('findConflictingHoliday', () => {
  test('Conflicts two fixed holidays on the same day and month', () => {
    expect(
      findConflictingHoliday({ ...christmas, date: '2030-12-25' }, [christmas])
    ).toBe(christmas)
  })

  test('Conflicts two moveable holidays with the same days from Easter', () => {
    expect(findConflictingHoliday({ ...goodFriday }, [goodFriday])).toBe(
      goodFriday
    )
    expect(
      findConflictingHoliday({ ...goodFriday, easterOffset: -3 }, [goodFriday])
    ).toBeUndefined()
  })

  test('Accepts a fixed and a moveable holiday on the same date in some year', () => {
    expect(getHolidayDateInYear(goodFriday, 2000)).toBe('2000-04-21')
    expect(findConflictingHoliday(goodFriday, [tiradentes])).toBeUndefined()
    expect(findConflictingHoliday(tiradentes, [goodFriday])).toBeUndefined()
  })

  test('Conflicts a one-off holiday with any holiday on its date', () => {
    expect(findConflictingHoliday(localHoliday, [goodFriday])).toBe(goodFriday)
    expect(
      findConflictingHoliday(goodFriday, [
        { ...localHoliday, date: '2030-04-19' }
      ])
    ).toMatchObject({ date: '2030-04-19' })
    expect(
      findConflictingHoliday({ ...localHoliday, date: '2030-12-25' }, [
        christmas
      ])
    ).toBe(christmas)
    expect(
      findConflictingHoliday({ ...localHoliday, date: '2027-04-03' }, [
        localHoliday
      ])
    ).toBeUndefined()
  })

  test('Conflicts only the holidays valid in the same years', () => {
    const newDate = { ...cityFestival, firstYear: 2027, lastYear: null }
    expect(findConflictingHoliday(newDate, [cityFestival])).toBeUndefined()
    expect(
      findConflictingHoliday({ ...newDate, firstYear: 2026 }, [cityFestival])
    ).toBe(cityFestival)
    expect(
      findConflictingHoliday({ ...localHoliday, date: '2027-08-15' }, [
        cityFestival
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
  test('Returns the fixed holidays as fixed and the Easter-based ones as moveable', () => {
    const holidays = getNationalHolidays()
    expect(
      holidays.map(({ name, recurrence, easterOffset }) => [
        name,
        recurrence,
        easterOffset
      ])
    ).toEqual([
      ['Confraternização Universal', 'yearly', null],
      ['Tiradentes', 'yearly', null],
      ['Dia do Trabalho', 'yearly', null],
      ['Independência do Brasil', 'yearly', null],
      ['Nossa Senhora Aparecida', 'yearly', null],
      ['Finados', 'yearly', null],
      ['Proclamação da República', 'yearly', null],
      ['Dia Nacional de Zumbi e da Consciência Negra', 'yearly', null],
      ['Natal', 'yearly', null],
      ['Carnaval', 'easter', -48],
      ['Carnaval', 'easter', -47],
      ['Paixão de Cristo', 'easter', -2],
      ['Corpus Christi', 'easter', 60]
    ])
    expect(
      holidays.map((holiday) => getHolidayDateInYear(holiday, 2026)).slice(9)
    ).toEqual(['2026-02-16', '2026-02-17', '2026-04-03', '2026-06-04'])
  })
})
