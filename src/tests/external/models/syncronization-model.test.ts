// @vitest-environment node

import { Company, PunchRecord, User } from '@prisma/client'
import { isPIS } from 'validation-br'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  adminUserModel,
  deviceCredentialsModel,
  punchRecordModel,
  synchronizationModel,
  TAdminUserWithRelations,
  TSynchronizationCredentials,
  userModel
} from '@/models'
import orchestrator from '@/tests/orchestrator'
import { normalizePis } from '@/utils'

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
  credentials = {
    ...adminUser.deviceCredentials!,
    deviceCredentialsId: adminUser.deviceCredentialsId!
  }
})

describe('Synchronization Model', () => {
  test('Synchronize company', async () => {
    const data = await synchronizationModel.receive.company({
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
    await synchronizationModel.receive.users({
      companyId: adminUser.companyId!,
      credentials
    })

    const usersAfterSync = await userModel.findManyByCompanyId(
      adminUser.companyId!
    )
    expect(usersAfterSync.length).toBeGreaterThan(0)
    expect(usersAfterSync.length).toBeGreaterThan(0)

    const expectedData: User = {
      id: expect.any(String),
      name: expect.any(String),
      cpf: usersAfterSync[0].cpf,
      password: expect.any(String),
      pis: expect.any(String),
      code: expect.any(Number),
      companyId: adminUser.companyId!,
      adminUserId: null,
      bars: expect.any(String),
      rfid: expect.any(Number),
      registration: expect.any(Number),
      templatesCount: expect.any(Number),
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
    const date = new Date()
    const punchRecords = await punchRecordModel.findMany()
    expect(punchRecords).toEqual([])

    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    await synchronizationModel.receive.afd({
      credentials,
      params: {
        initialDate: {
          day,
          month,
          year
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
    expect(data.datetime.getDate()).toBeGreaterThanOrEqual(day - 1) // A API dispositivo de ponto retorna dados do dia anterior
    expect(data.datetime.getMonth() + 1).toBe(month)
    expect(data.datetime.getFullYear()).toBe(year)
  })
})
