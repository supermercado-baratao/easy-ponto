// @vitest-environment node

import { isPIS } from 'validation-br'
import { beforeAll, describe, expect, test } from 'vitest'

import type { Company, PunchRecord, User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { adminUserModel } from '@/models/admin-user/model'
import { TAdminUserWithRelations } from '@/models/admin-user/types'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { normalizePis } from '@/models/synchronization/_utils/normalize'
import { synchronizationModel } from '@/models/synchronization/model'
import { TSynchronizationCredentials } from '@/models/synchronization/types'
import { userModel } from '@/models/user/model'
import orchestrator from '@/tests/orchestrator'

let adminUser: TAdminUserWithRelations
let credentials: TSynchronizationCredentials

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  const { id: adminUserId } = await adminUserModel.create()
  const { id: deviceCredentialsId } = await deviceCredentialsModel.upsert({
    ip: process.env.DEVICE_IP!,
    login: process.env.DEVICE_LOGIN!,
    password: process.env.DEVICE_PASSWORD!,
    adminUserId
  })
  await adminUserModel.update({
    id: adminUserId,
    deviceCredentialsId
  })
  adminUser = await adminUserModel.findUniqueById(adminUserId)
  credentials = adminUser.deviceCredentials!
})

describe('Synchronization Model', () => {
  test('Synchronize company', async () => {
    const data = await synchronizationModel.synchronizeCompany({
      adminUserId: adminUser.id,
      credentials
    })
    const expectedData: Company = {
      id: expect.any(String),
      name: expect.any(String),
      address: expect.any(String),
      cpf: expect.any(String),
      cpfCnpj: expect.any(String),
      cei: expect.any(String),
      tipoDoc: expect.any(Number),
      registration: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    }
    expect(data).toEqual(expectedData)

    const adminUserAfterSync = await adminUserModel.findUniqueById(adminUser.id)
    expect(adminUserAfterSync.companyId).toBe(data.id)
    expect(adminUserAfterSync.company).toEqual(data)
    adminUser = adminUserAfterSync
  })

  test('Synchronize users', async () => {
    const users = await userModel.findManyByCompanyId(adminUser.companyId!)
    expect(users).toEqual([])
    await synchronizationModel.synchronizeUsers({
      companyId: adminUser.companyId!,
      credentials
    })

    const usersAfterSync = await userModel.findManyByCompanyId(
      adminUser.companyId!
    )
    expect(usersAfterSync.length).toBeGreaterThan(0)

    const expectedData: User = {
      id: expect.any(String),
      name: expect.any(String),
      cpf: usersAfterSync[0].cpf,
      password: expect.any(String),
      pis: expect.any(String),
      code: expect.any(String),
      companyId: adminUser.companyId!,
      adminUserId: null,
      bars: expect.any(String),
      rfid: expect.any(String),
      registration: expect.any(String),
      templatesCount: expect.any(Number),
      admissionDate: null,
      department: null,
      payrollNumber: null,
      position: null,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    }
    expect(usersAfterSync[0]).toEqual(expectedData)
    expect(
      typeof usersAfterSync[0].cpf === 'string' ||
        usersAfterSync[0].cpf === null
    ).toBe(true)
  })

  test('Synchronize AFD', async () => {
    // A full week guarantees punch records on any day the test runs
    const initialDate = dayjs().subtract(7, 'day')
    const punchRecords = await punchRecordModel.findMany()
    expect(punchRecords).toEqual([])

    await synchronizationModel.synchronizeAfd({
      credentials,
      userPis: null,
      companyId: adminUser.companyId!,
      params: {
        initialDate: {
          day: initialDate.date(),
          month: initialDate.month() + 1,
          year: initialDate.year()
        }
      }
    })

    const punchRecordsAfterSync = await punchRecordModel.findMany()
    expect(punchRecordsAfterSync.length).toBeGreaterThan(0)

    const data = punchRecordsAfterSync[0]
    const expectedData: PunchRecord = {
      id: expect.any(String),
      pis: expect.any(String),
      datetime: expect.any(Date),
      afdDatetime: expect.any(Date),
      nsr: expect.any(Number),
      registrationType: expect.any(String),
      hexadecimalCheckDigit: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date)
    }
    expect(data).toEqual(expectedData)

    const pis = normalizePis(data.pis)

    if (pis.length === 11) {
      expect(isPIS(data.pis)).toBeTruthy()
    }
    expect(data.datetime).toEqual(data.afdDatetime)
    // The device API also returns records from the day before the initial date
    const oldestAllowedDate = initialDate.subtract(1, 'day').startOf('day')
    punchRecordsAfterSync.forEach(({ datetime }) => {
      expect(datetime.getTime()).toBeGreaterThanOrEqual(
        oldestAllowedDate.valueOf()
      )
    })
  })
})
