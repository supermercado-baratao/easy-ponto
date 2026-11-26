import { faker } from '@faker-js/faker'
import { verifyPassword } from 'better-auth/crypto'
import { sql } from 'drizzle-orm'
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

import { database } from '@/infra/database/client'
import { ValidationError } from '@/infra/errors'
import { accountModel } from '@/models/account/model'
import {
  EMPLOYEE_ROLE,
  getDefaultPassword,
  getEmployeeEmail
} from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import type { TDeviceUser } from '@/models/device/types'
import { DEFAULT_DEVICE_MODEL } from '@/models/device/utils'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { HoursBankInitialBalanceError } from '@/models/hours-bank/errors'
import { hoursBankModel } from '@/models/hours-bank/model'
import { justificationModel } from '@/models/justification/model'
import { justificationTypeModel } from '@/models/justification-type/model'
import { scheduleModel } from '@/models/schedule/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { synchronizationModel } from '@/models/synchronization/model'
import type { TCodeResolutions } from '@/models/synchronization/types'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { mockDeviceAdapter } from '@/tests/_utils/device-adapter'
import {
  createDayRow,
  createEmployee,
  createReportFile,
  createReportRows,
  type TRow
} from '@/tests/_utils/secullum-report'
import orchestrator from '@/tests/orchestrator'

const [deviceUser] = deviceUsers

const findAccount = async (
  authUserId: string
): Promise<{
  email: string
  mustChangePassword: boolean
  password: string
}> => {
  const [account] = await database.execute<{
    email: string
    mustChangePassword: boolean
    password: string
  }>(
    sql`
      SELECT auth_users.email, auth_users.must_change_password AS "mustChangePassword",
        auth_accounts.password
      FROM auth_users
      JOIN auth_accounts ON auth_accounts.user_id = auth_users.id
      WHERE auth_users.id = ${authUserId}
    `,
    'objects'
  )
  return account
}

const compareNames = (a: string, b: string): number => a.localeCompare(b)

const populate = async () => {
  const company = await companyModel.create(orchestrator.createCompanyData())
  const credentials = await deviceCredentialsModel.upsert({
    model: DEFAULT_DEVICE_MODEL,
    companyId: company.id,
    ip: faker.internet.ipv4(),
    login: faker.internet.username(),
    password: faker.internet.password()
  })
  return { credentials, company }
}

const synchronize = (
  users: TDeviceUser[],
  { credentials, company }: Awaited<ReturnType<typeof populate>>
) => {
  mockDeviceAdapter({ loadUsers: async () => users })
  return synchronizationModel.synchronizeUsers({
    companyId: company.id,
    credentials
  })
}

const importFile = (
  file: File,
  { credentials, company }: Awaited<ReturnType<typeof populate>>
) => {
  mockDeviceAdapter({ loadUsers: async () => [deviceUser] })
  return synchronizationModel.importFile({
    file,
    format: 'secullum',
    company,
    credentials
  })
}

const importFileWithResolutions = (
  file: File,
  { credentials, company }: Awaited<ReturnType<typeof populate>>,
  resolutions?: TCodeResolutions
) => {
  mockDeviceAdapter({ loadUsers: async () => [deviceUser] })
  return synchronizationModel.importFile({
    file,
    format: 'secullum',
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

const REST_DAY = {
  'Ent. 1': 'Folga',
  'Saí. 1': 'Folga',
  'Ent. 2': 'Folga',
  'Saí. 2': 'Folga'
}

const WHOLE_DAY_FOLGA = {
  'Ent. 1': 'FOLGA',
  'Saí. 1': 'FOLGA',
  'Ent. 2': 'FOLGA',
  'Saí. 2': 'FOLGA'
}

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

const createInssType = (companyId: string) =>
  justificationTypeModel.create({
    companyId,
    name: 'Afastamento pelo INSS',
    effect: 'excuse'
  })

const createDaysFile = (days: TRow[]): File =>
  createReportFile(
    createReportRows({
      employees: [createEmployee({ name: deviceUser.name, totals: {}, days })]
    })
  )

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
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Synchronization Model', () => {
  describe('synchronizeCompany', () => {
    const deviceCompany = {
      name: 'MERCADO DO RELOGIO',
      address: 'RUA DO RELOGIO, 1',
      cpf: CPF.fake().value,
      tipoDoc: 0,
      cpfCnpj: CPF.fake().value,
      cei: '0'
    }

    test('Lists the fields that differ from the device without saving them', async () => {
      const populated = await populate()
      mockDeviceAdapter({ loadCompany: async () => deviceCompany })
      const changes = await synchronizationModel.loadCompanyChanges({
        companyId: populated.company.id,
        credentials: populated.credentials
      })
      expect(changes.map(({ field }) => field)).toEqual([
        'name',
        'address',
        'cpf',
        'tipoDoc',
        'cpfCnpj',
        'cei'
      ])
      const company = await companyModel.findUniqueById(populated.company.id)
      expect(company.name).toBe(populated.company.name)
    })

    test('Saves only the chosen fields and keeps the registration', async () => {
      const populated = await populate()
      mockDeviceAdapter({ loadCompany: async () => deviceCompany })
      const company = await synchronizationModel.synchronizeCompany({
        companyId: populated.company.id,
        credentials: populated.credentials,
        fields: ['name', 'address']
      })
      expect(company).toMatchObject({
        name: deviceCompany.name,
        address: deviceCompany.address,
        cpf: populated.company.cpf,
        tipoDoc: populated.company.tipoDoc,
        cpfCnpj: populated.company.cpfCnpj,
        cei: populated.company.cei,
        registration: populated.company.registration
      })
    })

    test('Saves every field of the device when none is chosen', async () => {
      const populated = await populate()
      mockDeviceAdapter({ loadCompany: async () => deviceCompany })
      const company = await synchronizationModel.synchronizeCompany({
        companyId: populated.company.id,
        credentials: populated.credentials
      })
      expect(company).toMatchObject({
        ...deviceCompany,
        registration: populated.company.registration
      })
    })

    test('Refuses a choice that leaves the company invalid', async () => {
      const populated = await populate()
      mockDeviceAdapter({ loadCompany: async () => deviceCompany })
      // The device's CPF document type doesn't match the saved CNPJ
      await expect(
        synchronizationModel.synchronizeCompany({
          companyId: populated.company.id,
          credentials: populated.credentials,
          fields: ['tipoDoc']
        })
      ).rejects.toBeInstanceOf(ValidationError)
    })
  })

  describe('synchronizeUsers', () => {
    test('Creates the users found on the device', async () => {
      const data = await populate()

      const users = await synchronize(deviceUsers, data)

      expect(users).toHaveLength(deviceUsers.length)
      expect(users.map(({ name }) => name).toSorted(compareNames)).toEqual(
        deviceUsers.map(({ name }) => name).toSorted(compareNames)
      )
    })

    test('Updates device fields and preserves the imported data and the status', async () => {
      const data = await populate()
      const [{ id }] = await synchronize([deviceUser], data)
      const imported = {
        admissionDate: new Date('2026-01-15T00:00:00.000Z'),
        department: 'Financeiro',
        payrollNumber: '42',
        position: 'Analista',
        status: 'on-leave'
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

      const [user] = await synchronize([{ ...deviceUser, cpf: null }], data)

      expect(user.cpf).toBe(cpf)
    })

    test('Replaces the saved CPF when the device has one', async () => {
      const data = await populate()
      const [{ id }] = await synchronize([deviceUser], data)
      await userModel.updateMany([{ id, cpf: CPF.fake().value }])

      const [user] = await synchronize(
        [{ ...deviceUser, cpf: '12345678901' }],
        data
      )

      expect(user.cpf).toBe('12345678901')
    })

    test('Creates the account of an employee with a CPF, with the default password', async () => {
      const data = await populate()
      const cpf = CPF.fake().value

      const [user] = await synchronize([{ ...deviceUser, cpf }], data)

      const account = await findAccount(user.authUserId!)
      expect(account.email).toBe(getEmployeeEmail(cpf))
      expect(account.mustChangePassword).toBe(true)
      expect(
        await verifyPassword({
          hash: account.password,
          password: getDefaultPassword(user.name, cpf)
        })
      ).toBe(true)
      const memberships = await accountModel.findMemberships(user.authUserId!)
      expect(
        memberships.map(({ organizationId, role }) => [organizationId, role])
      ).toEqual([[data.company.id, EMPLOYEE_ROLE]])
    })

    test('Creates no account for an employee without a valid CPF', async () => {
      const data = await populate()

      const [withoutCpf, withInvalidCpf] = await synchronize(
        [
          { ...deviceUser, cpf: null },
          { ...deviceUsers[1], cpf: '11111111111' }
        ],
        data
      )

      expect(withoutCpf.authUserId).toBeNull()
      expect(withInvalidCpf.authUserId).toBeNull()
    })

    test('Links the same CPF in two companies to one account', async () => {
      const data = await populate()
      const otherData = await populate()
      const cpf = CPF.fake().value
      const [user] = await synchronize([{ ...deviceUser, cpf }], data)
      const firstAccount = await findAccount(user.authUserId!)

      const [otherUser] = await synchronize([{ ...deviceUser, cpf }], otherData)

      expect(otherUser.authUserId).toBe(user.authUserId)
      const account = await findAccount(user.authUserId!)
      expect(account.password).toBe(firstAccount.password)
      const memberships = await accountModel.findMemberships(user.authUserId!)
      expect(memberships.map(({ organizationId }) => organizationId)).toEqual([
        data.company.id,
        otherData.company.id
      ])
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

    test('Links the users to a weekly pattern from the first day of the period', async () => {
      const data = await populate()

      await importFile(createScheduleFile('8:00'), data)

      const [user] = await userModel.findManyByCompanyId(data.company.id)
      const [shiftPattern] = await shiftPatternModel.findManyByCompanyId(
        data.company.id
      )
      expect(shiftPattern.name).toBe('Seg 08:00–12:00')
      expect(shiftPattern.versions[0]).toMatchObject({
        startDate: '2025-10-01',
        cycleLength: 7
      })
      const assignments = await shiftAssignmentModel.findManyByUserId({
        userId: user.id,
        companyId: data.company.id
      })
      expect(assignments).toMatchObject([
        {
          shiftPatternId: shiftPattern.id,
          startDate: '2025-10-01',
          endDate: null,
          cycleStartDay: 3
        }
      ])
      const days = await shiftAssignmentModel.findUserDays({
        userId: user.id,
        companyId: data.company.id,
        initialDate: '2025-09-30',
        finalDate: '2025-10-07'
      })
      expect(days.map(({ kind }) => kind)).toEqual([
        'unassigned',
        'off',
        'off',
        'off',
        'off',
        'off',
        'work',
        'off'
      ])
      expect(days[6].pairs).toEqual([{ entry: 480, exit: 720 }])
    })

    test('Keeps one pattern and one link when the same file is imported again', async () => {
      const data = await populate()
      await importFile(createScheduleFile('8:00'), data)

      await importFile(createScheduleFile('8:00'), data)

      const [user] = await userModel.findManyByCompanyId(data.company.id)
      expect(
        await shiftPatternModel.findManyByCompanyId(data.company.id)
      ).toHaveLength(1)
      expect(
        await shiftAssignmentModel.findManyByUserId({
          userId: user.id,
          companyId: data.company.id
        })
      ).toHaveLength(1)
    })

    test('Replaces the link from the first day of the period when the schedule changes', async () => {
      const data = await populate()
      await importFile(createScheduleFile('8:00'), data)

      await importFile(createScheduleFile('9:00'), data)

      const [user] = await userModel.findManyByCompanyId(data.company.id)
      const shiftPatterns = await shiftPatternModel.findManyByCompanyId(
        data.company.id
      )
      expect(shiftPatterns.map(({ name }) => name)).toEqual([
        'Seg 08:00–12:00',
        'Seg 09:00–12:00'
      ])
      expect(
        await shiftAssignmentModel.findManyByUserId({
          userId: user.id,
          companyId: data.company.id
        })
      ).toMatchObject([
        { shiftPatternId: shiftPatterns[1].id, startDate: '2025-10-01' }
      ])
    })
  })

  describe('importFile with justifications', () => {
    test('Returns the unknown codes of the users found without saving anything', async () => {
      const data = await populate()
      await justificationTypeModel.create({
        companyId: data.company.id,
        name: 'FOLGA',
        effect: 'deduct'
      })

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data
      )

      expect(result).toMatchObject({
        status: 'unresolved',
        unknownCodes: ['INSS'],
        types: expect.arrayContaining([
          expect.objectContaining({ name: 'FOLGA' })
        ])
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

    test('Saves the justifications with the types chosen for the codes', async () => {
      const data = await populate()
      const inss = await createInssType(data.company.id)
      const compensation = await justificationTypeModel.create({
        companyId: data.company.id,
        name: 'Folga do banco de horas',
        effect: 'deduct'
      })

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data,
        { INSS: inss.id, FOLGA: compensation.id }
      )

      expect(result).toMatchObject({
        status: 'imported',
        skippedJustifications: 0
      })
      expect(await findJustifications(data.company.id)).toEqual([
        expect.objectContaining({
          startDate: '2025-10-06',
          endDate: '2025-10-07',
          startTime: null,
          endTime: null,
          type: expect.objectContaining({
            name: 'Afastamento pelo INSS',
            effect: 'excuse'
          })
        }),
        expect.objectContaining({
          startDate: '2025-10-08',
          endDate: '2025-10-08',
          startTime: 780,
          endTime: 980,
          typeId: compensation.id
        })
      ])
    })

    test('Reuses the choices of an earlier import for the same codes', async () => {
      const data = await populate()
      const types = await justificationTypeModel.findManyByCompanyId(
        data.company.id
      )
      const compensation = types.find(({ name }) => name === 'Compensação')!
      const inss = await createInssType(data.company.id)
      await importFileWithResolutions(createJustificationsFile(), data, {
        INSS: inss.id,
        FOLGA: compensation.id
      })
      const [user] = await userModel.findManyByCompanyId(data.company.id)
      const [saved] = await findJustifications(data.company.id)
      await justificationModel.remove({
        id: saved.id,
        companyId: data.company.id
      })

      const result = await importFileWithResolutions(
        createJustificationsFile(),
        data
      )

      expect(result).toMatchObject({ status: 'imported' })
      expect(await findJustifications(data.company.id)).toEqual([
        expect.objectContaining({
          userId: user.id,
          startDate: '2025-10-06',
          type: expect.objectContaining({ name: 'Afastamento pelo INSS' })
        }),
        expect.objectContaining({
          startDate: '2025-10-08',
          typeId: compensation.id
        })
      ])
    })

    test('Asks for the weekly rest on a workday of the schedule, like any other code', async () => {
      const data = await populate()

      const result = await importFileWithResolutions(
        createDaysFile([
          createDayRow('05/10/25 - dom', REST_DAY),
          createDayRow('06/10/25 - seg', REST_DAY)
        ]),
        data
      )

      expect(result).toMatchObject({
        status: 'unresolved',
        unknownCodes: ['Folga']
      })
    })

    test('Matches a code to a type name only with the same case', async () => {
      const data = await populate()
      await justificationTypeModel.create({
        companyId: data.company.id,
        name: 'FOLGA',
        effect: 'deduct'
      })

      const result = await importFileWithResolutions(
        createDaysFile([createDayRow('06/10/25 - seg', REST_DAY)]),
        data
      )

      expect(result).toMatchObject({
        status: 'unresolved',
        unknownCodes: ['Folga']
      })
    })

    test('Does not duplicate the justifications when the same file is imported again', async () => {
      const data = await populate()
      const [inss, compensation] = await Promise.all([
        createInssType(data.company.id),
        justificationTypeModel.create({
          companyId: data.company.id,
          name: 'Folga do banco de horas',
          effect: 'deduct'
        })
      ])
      const resolutions = { INSS: inss.id, FOLGA: compensation.id }
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
        ['INSS', 'FOLGA'].map((name) =>
          justificationTypeModel.create({
            companyId: data.company.id,
            name,
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
        justifications.map(({ startDate, type }) => [startDate, type.name])
      ).toEqual([
        ['2025-10-07', 'FOLGA'],
        ['2025-10-08', 'FOLGA']
      ])
    })

    test('Rejects a code without a chosen type', async () => {
      const data = await populate()
      const inss = await createInssType(data.company.id)

      await expect(
        importFileWithResolutions(createJustificationsFile(), data, {
          INSS: inss.id,
          FOLGA: ''
        })
      ).rejects.toMatchObject({
        issues: [
          expect.objectContaining({
            path: ['resolutions', 'FOLGA'],
            message: 'Selecione o tipo'
          })
        ]
      })
    })
  })

  describe('importInitialBalance', () => {
    test('Saves the balances as the closing of the report period', async () => {
      const data = await populate()
      await synchronize([deviceUser], data)

      const result = await synchronizationModel.importInitialBalance({
        file: createBalanceFile(),
        format: 'secullum',
        companyId: data.company.id
      })

      expect(result).toMatchObject({
        status: 'imported',
        unmatchedNames: ['Former Employee'],
        closing: {
          startDate: '2025-10-01',
          endDate: '2025-10-31',
          initial: true
        }
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

    test('Deducts the days of the codes whose type deducts from the hours bank', async () => {
      const data = await populate()
      await synchronize([deviceUser], data)
      const types = await justificationTypeModel.findManyByCompanyId(
        data.company.id
      )
      const compensation = types.find(({ name }) => name === 'Compensação')!
      const medicalCertificate = types.find(
        ({ name }) => name === 'Atestado médico'
      )!
      const file = createDaysFile([
        createDayRow('06/10/25 - seg', WHOLE_DAY_FOLGA),
        createDayRow('07/10/25 - ter', {
          'Ent. 1': '7:00',
          'Saí. 1': '11:00',
          'Ent. 2': 'FOLGA',
          'Saí. 2': 'FOLGA'
        }),
        createDayRow('08/10/25 - qua', {
          'Ent. 1': 'ATESTADO',
          'Saí. 1': 'ATESTADO',
          'Ent. 2': 'ATESTADO',
          'Saí. 2': 'ATESTADO'
        })
      ])
      const params = {
        file,
        format: 'secullum' as const,
        companyId: data.company.id
      }

      const unresolved = await synchronizationModel.importInitialBalance(params)
      const imported = await synchronizationModel.importInitialBalance({
        ...params,
        resolutions: {
          FOLGA: compensation.id,
          ATESTADO: medicalCertificate.id
        }
      })

      expect(unresolved).toMatchObject({
        status: 'unresolved',
        unknownCodes: ['FOLGA', 'ATESTADO']
      })
      expect(imported).toMatchObject({ status: 'imported' })
      const report = await hoursBankModel.generate({
        companyId: data.company.id,
        initialDate: '2025-10-01',
        finalDate: '2025-10-31'
      })
      expect(report.rows).toEqual([
        expect.objectContaining({ compensation: 640, balance: -640 })
      ])
    })

    test('Makes the imported balance the previous balance of the next period', async () => {
      const data = await populate()
      await synchronize([deviceUser], data)
      await synchronizationModel.importInitialBalance({
        file: createBalanceFile(),
        format: 'secullum',
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
          format: 'secullum',
          companyId: data.company.id
        })
      ).rejects.toBeInstanceOf(HoursBankInitialBalanceError)
    })
  })
})
