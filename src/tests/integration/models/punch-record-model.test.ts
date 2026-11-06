import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'

import { companyModel } from '@/models/company/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

let firstPis: string
let secondPis: string

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
  const users = mapDeviceUserToUser(deviceUsers.slice(0, 2), company.id)
  await userModel.createMany(users)
  ;[firstPis, secondPis] = users.map(({ pis }) => pis)

  await punchRecordModel.createManyNonExistentInAfd([
    { pis: firstPis, datetime: new Date('2026-03-01T08:00:00.000Z') },
    { pis: firstPis, datetime: new Date('2026-03-01T12:00:00.000Z') },
    { pis: secondPis, datetime: new Date('2026-03-01T08:00:00.000Z') }
  ])
})

describe('Punch Record Model', () => {
  describe('findMany', () => {
    test('Lists every punch record when called without arguments', async () => {
      const punchRecords = await punchRecordModel.findMany()

      expect(punchRecords).toHaveLength(3)
    })

    test('Applies the given filters', async () => {
      const punchRecords = await punchRecordModel.findMany({ pis: secondPis })

      expect(punchRecords).toHaveLength(1)
      expect(punchRecords[0].pis).toBe(secondPis)
    })
  })

  describe('findManyByDay', () => {
    test('Lists the records of the employee in each day of the period', async () => {
      await punchRecordModel.createManyNonExistentInAfd([
        { pis: firstPis, datetime: new Date('2026-02-28T23:59:00.000Z') },
        { pis: firstPis, datetime: new Date('2026-03-03T00:00:00.000Z') }
      ])

      const days = await punchRecordModel.findManyByDay({
        pis: firstPis,
        initialDate: '2026-03-01',
        finalDate: '2026-03-02'
      })

      expect(days.map(({ date }) => date)).toEqual(['2026-03-01', '2026-03-02'])
      expect(
        days[0].punchRecords.map(({ pis, datetime }) => [pis, datetime])
      ).toEqual([
        [firstPis, new Date('2026-03-01T08:00:00.000Z')],
        [firstPis, new Date('2026-03-01T12:00:00.000Z')]
      ])
      expect(days[1].punchRecords).toEqual([])
    })
  })
})
