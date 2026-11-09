import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import { holidayModel } from '@/models/holiday/model'
import orchestrator from '@/tests/orchestrator'

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.upsert({
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
  test('Adds the national holidays of the year', async () => {
    expect(
      await holidayModel.addNationalHolidays({ companyId, year: 2026 })
    ).toBe(13)

    const holidays = await holidayModel.findManyByYear({
      companyId,
      year: 2027
    })
    expect(holidays.map(({ dateInYear, name }) => [dateInYear, name])).toEqual([
      ['2027-01-01', 'Confraternização Universal'],
      ['2027-04-21', 'Tiradentes'],
      ['2027-05-01', 'Dia do Trabalho'],
      ['2027-09-07', 'Independência do Brasil'],
      ['2027-10-12', 'Nossa Senhora Aparecida'],
      ['2027-11-02', 'Finados'],
      ['2027-11-15', 'Proclamação da República'],
      ['2027-11-20', 'Dia Nacional de Zumbi e da Consciência Negra'],
      ['2027-12-25', 'Natal']
    ])
  })

  test('Adds only the national holidays not saved yet', async () => {
    expect(
      await holidayModel.addNationalHolidays({ companyId, year: 2026 })
    ).toBe(0)
    expect(
      await holidayModel.addNationalHolidays({ companyId, year: 2027 })
    ).toBe(4)
  })

  test('Rejects a holiday on a day that already has one', async () => {
    const promise = holidayModel.create({
      companyId,
      date: '2030-12-25',
      name: 'Natal',
      scope: 'national'
    })

    await expect(promise).rejects.toBeInstanceOf(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [
        { path: ['date'], message: 'Já existe um feriado nessa data: Natal' }
      ]
    })
  })

  test('Creates, updates and removes a holiday of the company', async () => {
    const holiday = await holidayModel.create({
      companyId,
      date: '2026-01-25',
      name: 'Aniversário da cidade',
      scope: 'municipal',
      recurring: 'on'
    })

    const updated = await holidayModel.update({
      id: holiday.id,
      companyId,
      date: '2026-01-26',
      name: 'Aniversário do município',
      scope: 'municipal'
    })
    expect(updated).toMatchObject({
      date: '2026-01-26',
      name: 'Aniversário do município',
      recurring: false
    })

    await holidayModel.remove({ id: holiday.id, companyId })
    const holidays = await holidayModel.findManyByYear({
      companyId,
      year: 2026
    })
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
        recurring: true
      })
    ).resolves.toMatchObject({ date: '2028-12-25' })
  })

  test('Does not change a holiday of another company', async () => {
    const holiday = await holidayModel.create({
      companyId: otherCompanyId,
      date: '2026-07-09',
      name: 'Revolução Constitucionalista',
      scope: 'state',
      recurring: true
    })

    await expect(
      holidayModel.update({
        id: holiday.id,
        companyId,
        date: holiday.date,
        name: 'Outro nome',
        scope: 'state'
      })
    ).rejects.toThrow(`Holiday ${holiday.id} not found in company ${companyId}`)
    await expect(
      holidayModel.remove({ id: holiday.id, companyId })
    ).rejects.toThrow(`Holiday ${holiday.id} not found in company ${companyId}`)
  })
})
