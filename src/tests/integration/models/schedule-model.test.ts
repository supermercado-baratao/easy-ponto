import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'

import { companyModel } from '@/models/company/model'
import { scheduleModel } from '@/models/schedule/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

let companyId: string
let userId: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()

  const company = await companyModel.upsert({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  companyId = company.id
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 1), company.id)
  )
  ;[{ id: userId }] = await userModel.findManyByCompanyId(company.id)
})

describe('Schedule Model', () => {
  test('Returns no schedule before the first one starts', async () => {
    await scheduleModel.save({
      companyId,
      userId,
      startDate: '2026-01-01',
      mondayEntry1: '07:00',
      mondayExit1: '11:00'
    })

    expect(
      await scheduleModel.findInEffect({ userId, date: '2025-12-31' })
    ).toBeNull()
  })

  test('Updates the schedule saved with the same start date', async () => {
    const schedule = await scheduleModel.save({
      companyId,
      userId,
      startDate: '2026-01-01',
      tuesdayEntry1: '08:00',
      tuesdayExit1: '12:00'
    })

    const saved = await scheduleModel.findInEffect({
      userId,
      date: '2026-01-01'
    })
    expect(saved).toEqual(schedule)
    expect(saved?.days.map(({ weekday }) => weekday)).toEqual([
      0, 1, 2, 3, 4, 5, 6
    ])
    expect(saved?.days.find(({ weekday }) => weekday === 1)?.entry1).toBeNull()
    expect(saved?.days.find(({ weekday }) => weekday === 2)).toMatchObject({
      entry1: 480,
      exit1: 720
    })
  })

  test('Keeps the previous schedule for the dates before a new one', async () => {
    const previous = await scheduleModel.findInEffect({
      userId,
      date: '2026-01-01'
    })
    const next = await scheduleModel.save({
      companyId,
      userId,
      startDate: '2026-03-01',
      wednesdayEntry1: '09:00',
      wednesdayExit1: '13:00'
    })

    expect(
      await scheduleModel.findInEffect({ userId, date: '2026-02-28' })
    ).toEqual(previous)
    expect(
      await scheduleModel.findInEffect({ userId, date: '2026-03-01' })
    ).toEqual(next)
    expect(
      await scheduleModel.findInEffect({ userId, date: '2026-12-31' })
    ).toEqual(next)
  })

  test('Refuses an employee of another company', async () => {
    await expect(
      scheduleModel.save({
        companyId: faker.string.uuid(),
        userId,
        startDate: '2026-05-01'
      })
    ).rejects.toThrow()
    expect(
      await scheduleModel.findInEffect({ userId, date: '2026-05-01' })
    ).toMatchObject({ startDate: '2026-03-01' })
  })
})
