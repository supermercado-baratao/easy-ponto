// @vitest-environment node

import { Company, User } from '@prisma/client'
import { beforeAll, describe, expect, test } from 'vitest'

import {
  adminUserModel,
  deviceCredentialsModel,
  synchronizationModel,
  TAdminUserWithRelations,
  userModel
} from '@/models'
import orchestrator from '@/tests/orchestrator'

let adminUser: TAdminUserWithRelations

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
})

describe('Synchronization Model', () => {
  test('Syncronize company', async () => {
    const data = await synchronizationModel.receive.company({
      adminUserId: adminUser.id,
      credentials: {
        ...adminUser.deviceCredentials!,
        deviceCredentialsId: adminUser.deviceCredentialsId!
      }
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

  test('Syncronize users', async () => {
    const users = await userModel.findManyByCompanyId(adminUser.companyId!)
    expect(users).toEqual([])
    await synchronizationModel.receive.users({
      companyId: adminUser.companyId!,
      credentials: {
        ...adminUser.deviceCredentials!,
        deviceCredentialsId: adminUser.deviceCredentialsId!
      }
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
})
