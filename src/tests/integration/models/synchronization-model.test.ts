import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi
} from 'vitest'

import { adminUserModel } from '@/models/admin-user/model'
import { companyModel } from '@/models/company/model'
import { deviceModel } from '@/models/device/model'
import { TDeviceUser } from '@/models/device/types'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { synchronizationModel } from '@/models/synchronization/model'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const [deviceUser] = deviceUsers

const populate = async () => {
  const adminUser = await adminUserModel.create()
  const credentials = await deviceCredentialsModel.upsert({
    adminUserId: adminUser.id,
    ip: faker.internet.ipv4(),
    login: faker.internet.username(),
    password: faker.internet.password()
  })
  const company = await companyModel.upsert({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  return { adminUser, credentials, company }
}

const synchronize = (
  users: TDeviceUser[],
  { credentials, company }: Awaited<ReturnType<typeof populate>>
) => {
  vi.spyOn(deviceModel, 'loadUsers').mockResolvedValue(users)
  return synchronizationModel.synchronizeUsers({
    companyId: company.id,
    credentials
  })
}

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
  vi.spyOn(deviceModel, 'login').mockResolvedValue('session')
  vi.spyOn(deviceModel, 'sessionIsValid').mockResolvedValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Synchronization Model', () => {
  describe('synchronizeUsers', () => {
    test('Creates the users found on the device', async () => {
      const data = await populate()

      const users = await synchronize(deviceUsers, data)

      expect(users).toHaveLength(deviceUsers.length)
      expect(users.map(({ name }) => name).sort()).toEqual(
        deviceUsers.map(({ name }) => name).sort()
      )
    })

    test('Updates device fields and preserves the imported data', async () => {
      const data = await populate()
      const [{ id }] = await synchronize([deviceUser], data)
      const imported = {
        adminUserId: data.adminUser.id,
        admissionDate: new Date('2026-01-15T00:00:00.000Z'),
        department: 'Financeiro',
        payrollNumber: '42',
        position: 'Analista'
      }
      await userModel.updateMany([{ id, ...imported }])

      const [user] = await synchronize(
        [{ ...deviceUser, name: 'Renamed on the device' }],
        data
      )

      expect(user).toMatchObject({
        id,
        ...imported,
        name: 'Renamed on the device'
      })
    })

    test('Keeps the saved CPF when the device has none', async () => {
      const data = await populate()
      const [{ id }] = await synchronize([deviceUser], data)
      const cpf = CPF.fake().value
      await userModel.updateMany([{ id, cpf }])

      const [user] = await synchronize(
        [{ ...deviceUser, cpf: undefined }],
        data
      )

      expect(user.cpf).toBe(cpf)
    })

    test('Replaces the saved CPF when the device has one', async () => {
      const data = await populate()
      const [{ id }] = await synchronize([deviceUser], data)
      await userModel.updateMany([{ id, cpf: CPF.fake().value }])

      const [user] = await synchronize(
        [{ ...deviceUser, cpf: 12345678901 }],
        data
      )

      expect(user.cpf).toBe('12345678901')
    })
  })
})
