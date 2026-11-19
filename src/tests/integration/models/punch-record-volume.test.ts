import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { faker } from '@faker-js/faker'
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
import { punchRecords } from '@/infra/database/schema'
import { companyModel } from '@/models/company/model'
import { deviceModel } from '@/models/device/model'
import { TDeviceUser } from '@/models/device/types'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { synchronizationModel } from '@/models/synchronization/model'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import { parsedAfd } from '@/tests/_mocks/parsed-afd'
import orchestrator from '@/tests/orchestrator'

// A little over a year for 60 employees, with 4 punches a day from Monday to Saturday
const YEAR_OF_RECORDS = 80_000
const EMPLOYEES = deviceUsers.slice(0, 37)

const toPis = ({ pis }: TDeviceUser): string => pis.toString().padStart(12, '0')

const createAfd = (total: number): string =>
  Array.from({ length: total }, (_, index) => {
    const nsr = (index + 1).toString().padStart(9, '0')
    const day = ((index % 28) + 1).toString().padStart(2, '0')
    const pis = toPis(EMPLOYEES[index % EMPLOYEES.length])
    return `${nsr}3${day}0120260800${pis}abcd\r`
  }).join('\n')

const populate = async () => {
  const company = await companyModel.create(orchestrator.createCompanyData())
  const credentials = await deviceCredentialsModel.upsert({
    companyId: company.id,
    ip: faker.internet.ipv4(),
    login: faker.internet.username(),
    password: faker.internet.password()
  })
  return { credentials, companyId: company.id }
}

const synchronize = (
  afd: string,
  data: Awaited<ReturnType<typeof populate>>,
  users: TDeviceUser[] = EMPLOYEES
) => {
  vi.spyOn(deviceModel, 'loadUsers').mockResolvedValue(users)
  vi.spyOn(deviceModel, 'getAfd').mockResolvedValue(afd)
  return synchronizationModel.synchronizeAfd({
    ...data,
    params: {}
  })
}

const countRecords = async (): Promise<number> =>
  await database.$count(punchRecords)

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

describe('Punch record volume', () => {
  describe('synchronizeAfd', () => {
    test('Imports a year of records and synchronizes again', async () => {
      const data = await populate()

      await synchronize(createAfd(YEAR_OF_RECORDS), data)
      expect(await countRecords()).toBe(YEAR_OF_RECORDS)

      await synchronize(createAfd(YEAR_OF_RECORDS + 10), data)
      expect(await countRecords()).toBe(YEAR_OF_RECORDS + 10)
    }, 120_000)

    test('Imports the complete AFD mock', async () => {
      const data = await populate()
      const afd = await readFile(
        path.join(import.meta.dirname, '../../_mocks/afd.txt'),
        'utf8'
      )

      await synchronize(afd, data, deviceUsers)

      expect(await countRecords()).toBe(parsedAfd.length)
    }, 60_000)

    test('Populates the database with the mocked data', async () => {
      await orchestrator.populateDatabaseWithMockedData()

      expect(await countRecords()).toBe(parsedAfd.length)
    }, 60_000)

    test('Keeps edited records when synchronizing again', async () => {
      const data = await populate()
      await synchronize(createAfd(1), data)
      const [{ id }] = await punchRecordModel.findMany({
        companyId: data.companyId
      })
      const datetime = new Date('2026-02-02T09:30:00.000Z')
      await punchRecordModel.update({ id, datetime })

      await synchronize(createAfd(2), data)

      const records = await punchRecordModel.findMany({
        companyId: data.companyId
      })
      expect(records).toHaveLength(2)
      expect(records.find((record) => record.id === id)?.datetime).toEqual(
        datetime
      )
    })

    test('Succeeds when the device has no records', async () => {
      const data = await populate()

      await synchronize('', data)

      const users = await userModel.findManyByCompanyId(data.companyId)
      expect(users).toHaveLength(EMPLOYEES.length)
      expect(await countRecords()).toBe(0)
    })

    test('Succeeds when the device has no users', async () => {
      const data = await populate()

      await synchronize('', data, [])

      const users = await userModel.findManyByCompanyId(data.companyId)
      expect(users).toEqual([])
      expect(await countRecords()).toBe(0)
    })

    test('Saves nothing when a batch fails', async () => {
      const data = await populate()
      await synchronize('', data)
      const pis = toPis(EMPLOYEES[0])
      const datetime = new Date('2026-01-01T08:00:00.000Z')
      const createRecord = (nsr: number, record = pis) => ({
        companyId: data.companyId,
        pis: record,
        datetime,
        afdDatetime: datetime,
        nsr,
        registrationType: '3',
        hexadecimalCheckDigit: 'abcd'
      })
      const records = Array.from({ length: 5000 }, (_, index) =>
        createRecord(index + 1)
      )

      await expect(
        punchRecordModel.createManyExistentsInAfd([
          ...records,
          createRecord(5001, '000000000000')
        ] as never)
      ).rejects.toThrow()

      expect(await countRecords()).toBe(0)
    })
  })

  describe('createManyNonExistentInAfd', () => {
    test('Inserts above the parameter limit and ignores saved records', async () => {
      const data = await populate()
      await synchronize('', data)
      const records = Array.from({ length: 20_000 }, (_, index) => ({
        companyId: data.companyId,
        pis: toPis(EMPLOYEES[index % EMPLOYEES.length]),
        datetime: new Date(Date.UTC(2026, 0, 1, 8, index))
      }))

      await punchRecordModel.createManyNonExistentInAfd(records as never)
      expect(await countRecords()).toBe(20_000)

      await punchRecordModel.createManyNonExistentInAfd(records as never)
      expect(await countRecords()).toBe(20_000)
    }, 60_000)
  })
})
