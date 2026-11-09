import type { Holiday, TInputData } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

export const HOLIDAY_SCOPES = ['national', 'state', 'municipal'] as const

export type THolidayScope = (typeof HOLIDAY_SCOPES)[number]

type THolidayDate = Pick<Holiday, 'date' | 'recurring'>

const getMonthDay = (date: string): string => date.slice(5)

export const getHolidayDateInYear = (
  { date, recurring }: THolidayDate,
  year: number
): string | null => {
  if (recurring) return `${year}-${getMonthDay(date)}`
  return date.startsWith(`${year}-`) ? date : null
}

export const findHoliday = <T extends THolidayDate>(
  date: string,
  holidays: T[]
): T | undefined =>
  holidays.find((holiday) =>
    holiday.recurring
      ? getMonthDay(holiday.date) === getMonthDay(date)
      : holiday.date === date
  )

export const findConflictingHoliday = <T extends THolidayDate>(
  holiday: THolidayDate,
  holidays: T[]
): T | undefined =>
  holidays.find((other) =>
    holiday.recurring || other.recurring
      ? getMonthDay(holiday.date) === getMonthDay(other.date)
      : holiday.date === other.date
  )

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
// in the federal calendar, so they come as municipal ones for the year, to be removed where the store opens
const EASTER_BASED_HOLIDAYS: {
  daysFromEaster: number
  name: string
  scope: THolidayScope
}[] = [
  { daysFromEaster: -48, name: 'Carnaval', scope: 'municipal' },
  { daysFromEaster: -47, name: 'Carnaval', scope: 'municipal' },
  { daysFromEaster: -2, name: 'Paixão de Cristo', scope: 'national' },
  { daysFromEaster: 60, name: 'Corpus Christi', scope: 'municipal' }
]

export const getNationalHolidays = (
  year: number
): Omit<TInputData<Holiday>, 'companyId'>[] => {
  const easter = dayjs(getEasterDate(year))
  return [
    ...FIXED_NATIONAL_HOLIDAYS.map(({ monthDay, name }) => ({
      date: `${year}-${monthDay}`,
      name,
      scope: 'national' as const,
      recurring: true
    })),
    ...EASTER_BASED_HOLIDAYS.map(({ daysFromEaster, name, scope }) => ({
      date: easter.add(daysFromEaster, 'day').format('YYYY-MM-DD'),
      name,
      scope,
      recurring: false
    }))
  ].toSorted((a, b) => a.date.localeCompare(b.date))
}
