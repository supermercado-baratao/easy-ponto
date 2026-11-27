import { MIN_YEAR } from '@/constants/year'
import type { Holiday, TInputData } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

export const HOLIDAY_SCOPES = ['national', 'state', 'municipal'] as const

export type THolidayScope = (typeof HOLIDAY_SCOPES)[number]

export const HOLIDAY_RECURRENCES = ['once', 'yearly', 'easter'] as const

export type THolidayRecurrence = (typeof HOLIDAY_RECURRENCES)[number]

// Easter falls between March 22 and April 25, so these offsets keep a moveable holiday in the year of its Easter
export const MIN_EASTER_OFFSET = -80

export const MAX_EASTER_OFFSET = 250

export type THolidayRule = Pick<
  Holiday,
  'recurrence' | 'date' | 'easterOffset' | 'firstYear' | 'lastYear'
>

const getMonthDay = (date: string): string => date.slice(5)

const getYear = (date: string): number => Number(date.slice(0, 4))

const getValidity = (holiday: THolidayRule): [number, number] =>
  holiday.recurrence === 'once'
    ? [getYear(holiday.date!), getYear(holiday.date!)]
    : [holiday.firstYear ?? -Infinity, holiday.lastYear ?? Infinity]

export const getHolidayDateInYear = (
  holiday: THolidayRule,
  year: number
): string | null => {
  const [firstYear, lastYear] = getValidity(holiday)
  if (year < firstYear || year > lastYear) return null
  if (holiday.recurrence === 'once') return holiday.date
  if (holiday.recurrence === 'yearly')
    return `${year}-${getMonthDay(holiday.date!)}`
  return dayjs(getEasterDate(year))
    .add(holiday.easterOffset!, 'day')
    .format('YYYY-MM-DD')
}

export const startsBeforeYear = (
  holiday: Pick<Holiday, 'recurrence' | 'firstYear'>,
  year?: number
): year is number =>
  year !== undefined &&
  holiday.recurrence !== 'once' &&
  (holiday.firstYear ?? -Infinity) < year

export const findHoliday = <T extends THolidayRule>(
  date: string,
  holidays: T[]
): T | undefined =>
  holidays.find(
    (holiday) => getHolidayDateInYear(holiday, getYear(date)) === date
  )

// A fixed and a moveable holiday may fall on the same date in some year (Good Friday on Tiradentes in 2000
// and 2079), so only the same rule conflicts, besides a one-off holiday on a date that already has one (#116)
const isSameRule = (holiday: THolidayRule, other: THolidayRule): boolean => {
  if (holiday.recurrence !== other.recurrence) return false
  return holiday.recurrence === 'easter'
    ? holiday.easterOffset === other.easterOffset
    : getMonthDay(holiday.date!) === getMonthDay(other.date!)
}

const conflicts = (holiday: THolidayRule, other: THolidayRule): boolean => {
  const [firstYear, lastYear] = getValidity(holiday)
  const [otherFirstYear, otherLastYear] = getValidity(other)
  if (firstYear > otherLastYear || otherFirstYear > lastYear) return false
  if (holiday.recurrence === 'once')
    return getHolidayDateInYear(other, firstYear) === holiday.date
  if (other.recurrence === 'once')
    return getHolidayDateInYear(holiday, otherFirstYear) === other.date
  return isSameRule(holiday, other)
}

export const findConflictingHoliday = <T extends THolidayRule>(
  holiday: THolidayRule,
  holidays: T[]
): T | undefined => holidays.find((other) => conflicts(holiday, other))

// Anonymous Gregorian algorithm (Meeus/Jones/Butcher): https://en.wikipedia.org/wiki/Date_of_Easter#Anonymous_Gregorian_algorithm
export const getEasterDate = (year: number): string => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const centuryRemainder = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const yearQuarter = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * centuryRemainder + 2 * yearQuarter - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const FIXED_NATIONAL_HOLIDAYS = [
  { monthDay: '01-01', name: 'Confraternização Universal' },
  { monthDay: '04-21', name: 'Tiradentes' },
  { monthDay: '05-01', name: 'Dia do Trabalho' },
  { monthDay: '09-07', name: 'Independência do Brasil' },
  { monthDay: '10-12', name: 'Nossa Senhora Aparecida' },
  { monthDay: '11-02', name: 'Finados' },
  { monthDay: '11-15', name: 'Proclamação da República' },
  { monthDay: '11-20', name: 'Dia Nacional de Zumbi e da Consciência Negra' },
  { monthDay: '12-25', name: 'Natal' }
]

// Carnaval and Corpus Christi are not national holidays by law (Lei 9.093/1995), only optional days off
// in the federal calendar, so they come as municipal ones, to be removed where the store opens
const EASTER_BASED_HOLIDAYS: {
  easterOffset: number
  name: string
  scope: THolidayScope
}[] = [
  { easterOffset: -48, name: 'Carnaval', scope: 'municipal' },
  { easterOffset: -47, name: 'Carnaval', scope: 'municipal' },
  { easterOffset: -2, name: 'Paixão de Cristo', scope: 'national' },
  { easterOffset: 60, name: 'Corpus Christi', scope: 'municipal' }
]

export const getNationalHolidays = (): Omit<
  TInputData<Holiday>,
  'companyId'
>[] => [
  ...FIXED_NATIONAL_HOLIDAYS.map(({ monthDay, name }) => ({
    // A fixed holiday keeps only the day and month of its date, so any year does
    date: `${MIN_YEAR}-${monthDay}`,
    name,
    scope: 'national' as const,
    recurrence: 'yearly' as const,
    easterOffset: null,
    firstYear: null,
    lastYear: null
  })),
  ...EASTER_BASED_HOLIDAYS.map(({ easterOffset, name, scope }) => ({
    date: null,
    name,
    scope,
    recurrence: 'easter' as const,
    easterOffset,
    firstYear: null,
    lastYear: null
  }))
]
