import { z } from 'zod'

import type { Holiday } from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { holidayRepository } from '@/repositories/holiday-repository'

import {
  addNationalHolidaysSchema,
  createSchema,
  findManyByYearSchema,
  removeSchema,
  updateSchema,
  yearSchema
} from './schema'
import type {
  THolidayAddNationalHolidaysParams,
  THolidayCreateData,
  THolidayFindManyByYearParams,
  THolidayInYear,
  THolidayRemoveParams,
  THolidayUpdateData
} from './types'
import {
  findConflictingHoliday,
  getHolidayDateInYear,
  getNationalHolidays
} from './utils'

const assertNoConflict = async (
  holiday: Pick<Holiday, 'companyId' | 'date' | 'recurring'> & { id?: string }
): Promise<void> => {
  const holidays = await holidayRepository.findManyByCompanyId(
    holiday.companyId
  )
  const conflict = findConflictingHoliday(
    holiday,
    holidays.filter(({ id }) => id !== holiday.id)
  )
  if (!conflict) return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['date'],
      message: `Já existe um feriado nessa data: ${conflict.name}`,
      input: holiday.date
    }
  ])
}

const resolveYear = (year?: string): number =>
  yearSchema.safeParse(year).data ?? wallClockNow().year()

const findManyByYear = async (
  params: THolidayFindManyByYearParams
): Promise<THolidayInYear[]> => {
  const { companyId, year } = findManyByYearSchema.parse(params)
  const holidays = await holidayRepository.findManyByCompanyId(companyId)
  return holidays
    .map((holiday) => ({
      ...holiday,
      dateInYear: getHolidayDateInYear(holiday, year)
    }))
    .filter((holiday): holiday is THolidayInYear => holiday.dateInYear !== null)
    .toSorted((a, b) => a.dateInYear.localeCompare(b.dateInYear))
}

const create = async (data: THolidayCreateData): Promise<Holiday> => {
  const validData = createSchema.parse(data)
  await assertNoConflict(validData)
  return await holidayRepository.create(validData)
}

const update = async (data: THolidayUpdateData): Promise<Holiday> => {
  const validData = updateSchema.parse(data)
  await assertNoConflict(validData)
  const holiday = await holidayRepository.update(validData)
  if (!holiday) {
    throw new Error(
      `Holiday ${validData.id} not found in company ${validData.companyId}`
    )
  }
  return holiday
}

const remove = async (params: THolidayRemoveParams): Promise<Holiday> => {
  const validParams = removeSchema.parse(params)
  const holiday = await holidayRepository.remove(validParams)
  if (!holiday) {
    throw new Error(
      `Holiday ${validParams.id} not found in company ${validParams.companyId}`
    )
  }
  return holiday
}

const addNationalHolidays = async (
  params: THolidayAddNationalHolidaysParams
): Promise<number> => {
  const { companyId, year } = addNationalHolidaysSchema.parse(params)
  const holidays = await holidayRepository.findManyByCompanyId(companyId)
  const newHolidays = getNationalHolidays(year).filter(
    (holiday) => !findConflictingHoliday(holiday, holidays)
  )
  return newHolidays.length === 0
    ? 0
    : await holidayRepository.createMany(
        newHolidays.map((holiday) => ({ ...holiday, companyId }))
      )
}

export const holidayModel = {
  resolveYear,
  findManyByYear,
  create,
  update,
  remove,
  addNationalHolidays
}
