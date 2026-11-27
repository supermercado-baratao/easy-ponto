import { z } from 'zod'

import type { Holiday } from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { NotFoundError } from '@/infra/errors'
import { holidayRepository } from '@/repositories/holiday-repository'

import {
  addNationalHolidaysSchema,
  createSchema,
  findManyByCompanyIdSchema,
  findManyByYearSchema,
  removeSchema,
  updateSchema,
  yearSchema
} from './schema'
import type {
  THolidayCreateData,
  THolidayFindManyByYearParams,
  THolidayInYear,
  THolidayRemoveParams,
  THolidayUpdateData
} from './types'
import type { THolidayRule } from './utils'
import {
  findConflictingHoliday,
  getHolidayDateInYear,
  getNationalHolidays,
  startsBeforeYear
} from './utils'

const assertNoConflict = (
  holiday: THolidayRule,
  holidays: Pick<Holiday, keyof THolidayRule | 'name'>[]
): void => {
  const conflict = findConflictingHoliday(holiday, holidays)
  if (!conflict) return

  const isEaster = holiday.recurrence === 'easter'
  throw new z.ZodError([
    {
      code: 'custom',
      path: [isEaster ? 'easterDays' : 'date'],
      message: `Já existe um feriado nessa data: ${conflict.name}`,
      input: isEaster ? holiday.easterOffset : holiday.date
    }
  ])
}

const findCompanyHoliday = async ({
  id,
  companyId
}: {
  id: string
  companyId: string
}): Promise<Holiday> => {
  const holiday = await holidayRepository.findById({ id, companyId })
  if (!holiday) {
    throw new NotFoundError({
      message: 'O feriado não foi encontrado.',
      cause: `Holiday ${id} not found in company ${companyId}`
    })
  }
  return holiday
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

const findManyByCompanyId = async (companyId: string): Promise<Holiday[]> =>
  await holidayRepository.findManyByCompanyId(
    findManyByCompanyIdSchema.parse(companyId)
  )

const create = async (data: THolidayCreateData): Promise<Holiday> => {
  const validData = createSchema.parse(data)
  assertNoConflict(
    validData,
    await holidayRepository.findManyByCompanyId(validData.companyId)
  )
  return await holidayRepository.create(validData)
}

const update = async (data: THolidayUpdateData): Promise<Holiday> => {
  const { id, fromYear, ...validData } = updateSchema.parse(data)
  const { companyId } = validData
  const holiday = await findCompanyHoliday({ id, companyId })
  const holidays = await holidayRepository.findManyByCompanyId(companyId)
  const others = holidays.filter((other) => other.id !== id)

  if (!startsBeforeYear(holiday, fromYear)) {
    assertNoConflict(validData, others)
    const updated = await holidayRepository.update({ id, ...validData })
    return updated ?? (await findCompanyHoliday({ id, companyId }))
  }

  const lastYear = fromYear - 1
  const newData =
    validData.recurrence === 'once'
      ? validData
      : { ...validData, firstYear: fromYear }
  assertNoConflict(newData, [...others, { ...holiday, lastYear }])
  return await holidayRepository.endAndCreate({
    id,
    companyId,
    lastYear,
    data: newData
  })
}

const remove = async (params: THolidayRemoveParams): Promise<Holiday> => {
  const { id, companyId, fromYear } = removeSchema.parse(params)
  const holiday = await findCompanyHoliday({ id, companyId })
  const removed = startsBeforeYear(holiday, fromYear)
    ? await holidayRepository.end({ id, companyId, lastYear: fromYear - 1 })
    : await holidayRepository.remove({ id, companyId })
  return removed ?? (await findCompanyHoliday({ id, companyId }))
}

const addNationalHolidays = async (companyId: string): Promise<number> => {
  const validCompanyId = addNationalHolidaysSchema.parse(companyId)
  const holidays = await holidayRepository.findManyByCompanyId(validCompanyId)
  const newHolidays = getNationalHolidays().filter(
    (holiday) => !findConflictingHoliday(holiday, holidays)
  )
  return newHolidays.length === 0
    ? 0
    : await holidayRepository.createMany(
        newHolidays.map((holiday) => ({
          ...holiday,
          companyId: validCompanyId
        }))
      )
}

export const holidayModel = {
  resolveYear,
  findManyByYear,
  findManyByCompanyId,
  create,
  update,
  remove,
  addNationalHolidays
}
