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
import { HoursBankInitialBalanceError } from '@/models/hours-bank/errors'
import { hoursBankModel } from '@/models/hours-bank/model'
import { scheduleModel } from '@/models/schedule/model'
import { synchronizationModel } from '@/models/synchronization/model'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import {
  createEmployee,
  createReportFile,
  createReportRows
} from '@/tests/_utils/secullum-report'
import orchestrator from '@/tests/orchestrator'

const [deviceUser] = deviceUsers

const compareNames = (a: string, b: string): number => a.localeCompare(b)

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

const importFile = (
  file: File,
  { credentials, company }: Awaited<ReturnType<typeof populate>>
) => {
  vi.spyOn(deviceModel, 'loadUsers').mockResolvedValue([deviceUser])
  return synchronizationModel.importFile({ file, company, credentials })
}

const createScheduleFile = (mondayEntry: string): File =>
  createReportFile(
    createReportRows({
      employees: [
        createEmployee({
          name: deviceUser.name,
          schedule: [['SEG', mondayEntry, '12:00']]
        })
      ]
    })
  )

const createBalanceFile = (): File =>
  createReportFile(
    createReportRows({
      employees: [
        createEmployee({
          name: deviceUser.name,
          totals: { Faltas: '1:00', 'Ex60%': '5:30', Ajuste: '0:30' },
          days: []
        }),
        createEmployee({ name: 'Former Employee', days: [] })
      ]
    })
  )

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
      expect(users.map(({ name }) => name).toSorted(compareNames)).toEqual(
        deviceUsers.map(({ name }) => name).toSorted(compareNames)
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
        [{ ...deviceUser, cpf: 12_345_678_901 }],
        data
      )

      expect(user.cpf).toBe('12345678901')
    })
  })

  describe('importFile', () => {
    test('Saves the schedules of the users found by name', async () => {
      const data = await populate()
      const file = createReportFile(
        createReportRows({
          employees: [
            createEmployee({ name: deviceUser.name }),
            createEmployee({ name: 'Not on the device' })
          ]
        })
      )

      await importFile(file, data)

      const [user] = await userModel.findManyByCompanyId(data.company.id)
      const schedule = await scheduleModel.findInEffect({
        userId: user.id,
        date: '2025-10-01'
      })
      expect(schedule?.startDate).toBe('2025-10-01')
      expect(schedule?.days[0]).toMatchObject({
        weekday: 0,
        entry1: null,
        exit1: null
      })
      expect(schedule?.days[1]).toMatchObject({
        weekday: 1,
        entry1: 420,
        exit1: 660,
        entry2: 780,
        exit2: 980,
        entry3: null,
        exit3: null
      })
    })

    test('Replaces the schedule when the same file is imported again', async () => {
      const data = await populate()
      await importFile(createScheduleFile('8:00'), data)

      await importFile(createScheduleFile('9:00'), data)

      const [user] = await userModel.findManyByCompanyId(data.company.id)
      const schedule = await scheduleModel.findInEffect({
        userId: user.id,
        date: '2025-10-01'
      })
      expect(schedule?.days).toHaveLength(7)
      expect(schedule?.days[1]).toMatchObject({ entry1: 540, exit1: 720 })
    })
  })

  describe('importInitialBalance', () => {
    test('Saves the balances as the closing of the report period', async () => {
      const data = await populate()
      await synchronize([deviceUser], data)

      const { closing, unmatchedNames } =
        await synchronizationModel.importInitialBalance({
          file: createBalanceFile(),
          companyId: data.company.id
        })

      expect(unmatchedNames).toEqual(['Former Employee'])
      expect(closing).toMatchObject({
        startDate: '2025-10-01',
        endDate: '2025-10-31',
        initial: true
      })
      const report = await hoursBankModel.generate({
        companyId: data.company.id,
        initialDate: '2025-10-01',
        finalDate: '2025-10-31'
      })
      expect(report.rows).toEqual([
        expect.objectContaining({
          name: deviceUser.name,
          previousBalance: 0,
          absence: 60,
          overtime60: 330,
          adjustment: 30,
          balance: 300
        })
      ])
    })

    test('Makes the imported balance the previous balance of the next period', async () => {
      const data = await populate()
      await synchronize([deviceUser], data)
      await synchronizationModel.importInitialBalance({
        file: createBalanceFile(),
        companyId: data.company.id
      })

      const report = await hoursBankModel.generate({
        companyId: data.company.id,
        finalDate: '2025-11-05'
      })

      expect(report.period.initialDate).toBe('2025-11-01')
      expect(report.rows[0].previousBalance).toBe(300)
    })

    test('Refuses the import when the company already has a closing', async () => {
      const data = await populate()
      await synchronize([deviceUser], data)
      await hoursBankModel.close({
        companyId: data.company.id,
        initialDate: '2025-11-01',
        finalDate: '2025-11-05'
      })

      await expect(
        synchronizationModel.importInitialBalance({
          file: createBalanceFile(),
          companyId: data.company.id
        })
      ).rejects.toBeInstanceOf(HoursBankInitialBalanceError)
    })
  })
})
