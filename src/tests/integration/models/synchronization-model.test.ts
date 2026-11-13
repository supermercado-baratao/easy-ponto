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
import { justificationModel } from '@/models/justification/model'
import { justificationTypeModel } from '@/models/justification-type/model'
import { scheduleModel } from '@/models/schedule/model'
import { synchronizationModel } from '@/models/synchronization/model'
import type { TCodeResolution } from '@/models/synchronization/types'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import {
  createDayRow,
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

const importFileWithResolutions = (
  file: File,
  { credentials, company }: Awaited<ReturnType<typeof populate>>,
  resolutions?: Record<string, TCodeResolution>
) => {
  vi.spyOn(deviceModel, 'loadUsers').mockResolvedValue([deviceUser])
  return synchronizationModel.importFile({
    file,
    company,
    credentials,
    resolutions
  })
}

const findJustifications = async (companyId: string) => {
  const [user] = await userModel.findManyByCompanyId(companyId)
  return await justificationModel.findManyInPeriod({
    userId: user.id,
    initialDate: '2025-10-01',
    finalDate: '2025-10-31'
  })
}

const WHOLE_DAY_INSS = {
  'Ent. 1': 'INSS',
  'Saí. 1': 'INSS',
  'Ent. 2': 'INSS',
  'Saí. 2': 'INSS'
}

const JUSTIFICATION_DAYS = [
  createDayRow('06/10/25 - seg', WHOLE_DAY_INSS),
  createDayRow('07/10/25 - ter', WHOLE_DAY_INSS),
  createDayRow('08/10/25 - qua', {
    'Ent. 1': '7:00',
    'Saí. 1': '11:00',
    'Ent. 2': 'FOLGA',
    'Saí. 2': 'FOLGA'
  })
]

const UNMATCHED_DAYS = [createDayRow('06/10/25 - seg', { 'Ent. 1': 'OUTRO' })]

const createJustificationsFile = (): File =>
  createReportFile(
    createReportRows({
      employees: [
        createEmployee({ name: deviceUser.name, days: JUSTIFICATION_DAYS }),
        createEmployee({ name: 'Not on the device', days: UNMATCHED_DAYS })
      ]
    })
  )

const INSS_RESOLUTION: Extract<TCodeResolution, { action: 'create' }> = {
  action: 'create',
  code: 'INSS',
  description: 'Afastamento pelo INSS',
  effect: 'excuse'
}

const RESOLUTIONS: Record<string, TCodeResolution> = { INSS: INSS_RESOLUTION }

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

  describe('importFile with justifications', () => {
    test('Returns the unknown codes of the users found without saving anything', async () => {
      const data = await populate()
      await justificationTypeModel.create({
        companyId: data.company.id,
        code: 'FOLGA',
        description: 'Folga do banco de horas',
        effect: 'deduct'
      })

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data
      )

      expect(result).toMatchObject({
        status: 'unresolved',
        unknownCodes: ['INSS'],
        types: [expect.objectContaining({ code: 'FOLGA' })]
      })
      const [user] = await userModel.findManyByCompanyId(data.company.id)
      expect(
        await scheduleModel.findInEffect({
          userId: user.id,
          date: '2025-10-01'
        })
      ).toBeNull()
      expect(await findJustifications(data.company.id)).toEqual([])
    })

    test('Saves the new types and the justifications with the chosen resolutions', async () => {
      const data = await populate()
      const dayOff = await justificationTypeModel.create({
        companyId: data.company.id,
        code: 'FOLGA DO BANCO',
        description: 'Folga do banco de horas',
        effect: 'deduct'
      })

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data,
        {
          ...RESOLUTIONS,
          INSS: { ...INSS_RESOLUTION, code: 'AFASTAMENTO' },
          FOLGA: { action: 'associate', typeId: dayOff.id }
        }
      )

      expect(result).toMatchObject({
        status: 'imported',
        skippedJustifications: 0
      })
      const types = await justificationTypeModel.findManyByCompanyId(
        data.company.id
      )
      expect(types.map(({ code }) => code)).toEqual([
        'AFASTAMENTO',
        'FOLGA DO BANCO'
      ])
      expect(await findJustifications(data.company.id)).toEqual([
        expect.objectContaining({
          startDate: '2025-10-06',
          endDate: '2025-10-07',
          startTime: null,
          endTime: null,
          type: expect.objectContaining({
            code: 'AFASTAMENTO',
            description: 'Afastamento pelo INSS',
            effect: 'excuse'
          })
        }),
        expect.objectContaining({
          startDate: '2025-10-08',
          endDate: '2025-10-08',
          startTime: 780,
          endTime: 980,
          typeId: dayOff.id
        })
      ])
    })

    test('Does not duplicate the justifications when the same file is imported again', async () => {
      const data = await populate()
      const resolutions: Record<string, TCodeResolution> = {
        ...RESOLUTIONS,
        FOLGA: {
          action: 'create',
          code: 'FOLGA',
          description: 'Folga do banco de horas',
          effect: 'deduct'
        }
      }
      await importFileWithResolutions(
        createJustificationsFile(),
        data,
        resolutions
      )

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data
      )

      expect(result).toMatchObject({
        status: 'imported',
        skippedJustifications: 0
      })
      expect(await findJustifications(data.company.id)).toHaveLength(2)
    })

    test('Skips and counts the justifications that overlap a different saved one', async () => {
      const data = await populate()
      const types = await Promise.all(
        ['INSS', 'FOLGA'].map((code) =>
          justificationTypeModel.create({
            companyId: data.company.id,
            code,
            description: code,
            effect: 'excuse'
          })
        )
      )
      await synchronize([deviceUser], data)
      const [user] = await userModel.findManyByCompanyId(data.company.id)
      await justificationModel.create({
        companyId: data.company.id,
        userId: user.id,
        typeId: types[1].id,
        startDate: '2025-10-07',
        endDate: '2025-10-07'
      })

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data
      )

      expect(result).toMatchObject({
        status: 'imported',
        skippedJustifications: 1
      })
      const justifications = await findJustifications(data.company.id)
      expect(
        justifications.map(({ startDate, type }) => [startDate, type.code])
      ).toEqual([
        ['2025-10-07', 'FOLGA'],
        ['2025-10-08', 'FOLGA']
      ])
    })

    test('Refuses a new type with the code of a saved one, saving nothing', async () => {
      const data = await populate()
      await justificationTypeModel.create({
        companyId: data.company.id,
        code: 'FOLGA',
        description: 'Folga do banco de horas',
        effect: 'deduct'
      })

      await expect(
        importFileWithResolutions(createJustificationsFile(), data, {
          INSS: { ...INSS_RESOLUTION, code: 'FOLGA' }
        })
      ).rejects.toMatchObject({
        issues: [
          expect.objectContaining({ path: ['resolutions', 'INSS', 'code'] })
        ]
      })
      const [user] = await userModel.findManyByCompanyId(data.company.id)
      expect(
        await scheduleModel.findInEffect({
          userId: user.id,
          date: '2025-10-01'
        })
      ).toBeNull()
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
