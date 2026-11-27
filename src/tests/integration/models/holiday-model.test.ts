import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import { holidayModel } from '@/models/holiday/model'
import orchestrator from '@/tests/orchestrator'

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.create({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  return id
}

let companyId: string
let otherCompanyId: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  companyId = await createCompany()
  otherCompanyId = await createCompany()
})

describe('Holiday Model', () => {
  test('Adds the national holidays with the moveable ones in every year', async () => {
    expect(await holidayModel.addNationalHolidays(companyId)).toBe(13)

    const holidays = await holidayModel.findManyByYear({
      companyId,
      year: 2027
    })
    expect(holidays.map(({ dateInYear, name }) => [dateInYear, name])).toEqual([
      ['2027-01-01', 'Confraternização Universal'],
      ['2027-02-08', 'Carnaval'],
      ['2027-02-09', 'Carnaval'],
      ['2027-03-26', 'Paixão de Cristo'],
      ['2027-04-21', 'Tiradentes'],
      ['2027-05-01', 'Dia do Trabalho'],
      ['2027-05-27', 'Corpus Christi'],
      ['2027-09-07', 'Independência do Brasil'],
      ['2027-10-12', 'Nossa Senhora Aparecida'],
      ['2027-11-02', 'Finados'],
      ['2027-11-15', 'Proclamação da República'],
      ['2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra'],
      ['2027-12-25', 'Natal']
    ])
  })

  test('Adds only the national holidays not saved yet', async () => {
    expect(await holidayModel.addNationalHolidays(companyId)).toBe(0)
  })

  test('Rejects a holiday on a day that already has one', async () => {
    const promise = holidayModel.create({
      companyId,
      date: '2030-12-25',
      name: 'Natal',
      scope: 'national',
      recurrence: 'once'
    })

    await expect(promise).rejects.toBeInstanceOf(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [
        { path: ['date'], message: 'Já existe um feriado nessa data: Natal' }
      ]
    })
    await expect(
      holidayModel.create({
        companyId,
        name: 'Sexta-feira Santa',
        scope: 'national',
        recurrence: 'easter',
        easterDays: 2,
        easterSide: 'before'
      })
    ).rejects.toMatchObject({
      issues: [
        {
          path: ['easterDays'],
          message: 'Já existe um feriado nessa data: Paixão de Cristo'
        }
      ]
    })
  })

  test('Accepts a moveable holiday that falls on a fixed one in some year', async () => {
    const holiday = await holidayModel.create({
      companyId,
      name: 'Festa da cidade',
      scope: 'municipal',
      recurrence: 'easter',
      easterDays: 18,
      easterSide: 'after'
    })

    const holidays = await holidayModel.findManyByYear({
      companyId,
      year: 2031
    })
    expect(
      holidays
        .filter(({ dateInYear }) => dateInYear === '2031-05-01')
        .map(({ name }) => name)
    ).toEqual(['Dia do Trabalho', 'Festa da cidade'])
    await holidayModel.remove({ id: holiday.id, companyId })
  })

  test('Creates, updates and removes a holiday of the company', async () => {
    const holiday = await holidayModel.create({
      companyId,
      date: '2026-01-25',
      name: 'Aniversário da cidade',
      scope: 'municipal',
      recurrence: 'yearly'
    })

    const updated = await holidayModel.update({
      id: holiday.id,
      companyId,
      date: '2026-01-26',
      name: 'Aniversário do município',
      scope: 'municipal',
      recurrence: 'once',
      fromYear: 'all'
    })
    expect(updated).toMatchObject({
      date: '2026-01-26',
      name: 'Aniversário do município',
      recurrence: 'once'
    })

    await holidayModel.remove({ id: holiday.id, companyId })
    const holidays = await holidayModel.findManyByYear({
      companyId,
      year: 2026
    })
    expect(holidays.map(({ id }) => id)).not.toContain(holiday.id)
  })

  test('Changes the date of a holiday from a year on, keeping the earlier years', async () => {
    const holiday = await holidayModel.create({
      companyId,
      date: '2026-08-15',
      name: 'Padroeira da cidade',
      scope: 'municipal',
      recurrence: 'yearly'
    })

    const moved = await holidayModel.update({
      id: holiday.id,
      companyId,
      date: '2028-08-16',
      name: 'Padroeira da cidade',
      scope: 'municipal',
      recurrence: 'yearly',
      fromYear: 2028
    })
    expect(moved).toMatchObject({ firstYear: 2028, lastYear: null })
    expect(moved.id).not.toBe(holiday.id)

    const findDate = async (year: number): Promise<string[]> => {
      const holidays = await holidayModel.findManyByYear({ companyId, year })
      return holidays
        .filter(({ name }) => name === 'Padroeira da cidade')
        .map(({ dateInYear }) => dateInYear)
    }
    expect(await findDate(2027)).toEqual(['2027-08-15'])
    expect(await findDate(2028)).toEqual(['2028-08-16'])

    await holidayModel.remove({ id: moved.id, companyId, fromYear: 2030 })
    expect(await findDate(2029)).toEqual(['2029-08-16'])
    expect(await findDate(2030)).toEqual([])
    expect(await findDate(2020)).toEqual(['2020-08-15'])
  })

  test('Updates a holiday in place when it starts in the year of the change', async () => {
    const holiday = await holidayModel.create({
      companyId,
      date: '2026-09-10',
      name: 'Emancipação',
      scope: 'municipal',
      recurrence: 'yearly',
      firstYear: 2026
    })

    const updated = await holidayModel.update({
      id: holiday.id,
      companyId,
      date: '2026-09-11',
      name: 'Emancipação',
      scope: 'municipal',
      recurrence: 'yearly',
      firstYear: 2026,
      fromYear: 2026
    })
    expect(updated).toMatchObject({ id: holiday.id, date: '2026-09-11' })

    await holidayModel.remove({ id: holiday.id, companyId, fromYear: 2026 })
    const holidays = await holidayModel.findManyByCompanyId(companyId)
    expect(holidays.map(({ id }) => id)).not.toContain(holiday.id)
  })

  test('Does not treat a holiday as conflicting with itself on update', async () => {
    const holidays = await holidayModel.findManyByYear({
      companyId,
      year: 2026
    })
    const christmas = holidays.find(({ name }) => name === 'Natal')!

    await expect(
      holidayModel.update({
        id: christmas.id,
        companyId,
        date: '2028-12-25',
        name: 'Natal',
        scope: 'national',
        recurrence: 'yearly'
      })
    ).resolves.toMatchObject({ id: christmas.id, date: '2028-12-25' })
  })

  test('Does not change a holiday of another company', async () => {
    const holiday = await holidayModel.create({
      companyId: otherCompanyId,
      date: '2026-07-09',
      name: 'Revolução Constitucionalista',
      scope: 'state',
      recurrence: 'yearly'
    })

    await expect(
      holidayModel.update({
        id: holiday.id,
        companyId,
        date: '2026-07-09',
        name: 'Outro nome',
        scope: 'state',
        recurrence: 'yearly'
      })
    ).rejects.toMatchObject({
      cause: `Holiday ${holiday.id} not found in company ${companyId}`
    })
    await expect(
      holidayModel.remove({ id: holiday.id, companyId })
    ).rejects.toMatchObject({
      cause: `Holiday ${holiday.id} not found in company ${companyId}`
    })
  })
})
