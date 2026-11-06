import { faker } from '@faker-js/faker'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { ZodError } from 'zod'

import { adminUserModel } from '@/models/admin-user/model'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
})

const createCredentials = () => ({
  ip: faker.internet.ipv4(),
  login: faker.internet.username(),
  password: faker.internet.password()
})

describe('Device Credentials Model', () => {
  describe('upsert', () => {
    test('Links the new credentials to the admin user', async () => {
      const { id: adminUserId } = await adminUserModel.create()

      const credentials = await deviceCredentialsModel.upsert({
        adminUserId,
        ...createCredentials()
      })

      const adminUser = await adminUserModel.findUniqueById(adminUserId)
      expect(adminUser.deviceCredentialsId).toBe(credentials.id)
    })

    test('Updates the credentials the admin user already has', async () => {
      const { id: adminUserId } = await adminUserModel.create()
      const saved = await deviceCredentialsModel.upsert({
        adminUserId,
        ...createCredentials()
      })
      const changes = createCredentials()

      const updated = await deviceCredentialsModel.upsert({
        adminUserId,
        ...changes
      })

      expect(updated).toMatchObject({ id: saved.id, ...changes })
    })

    test('Keeps the saved password when none is sent', async () => {
      const { id: adminUserId } = await adminUserModel.create()
      const saved = await deviceCredentialsModel.upsert({
        adminUserId,
        ...createCredentials()
      })
      const { ip, login } = createCredentials()

      const updated = await deviceCredentialsModel.upsert({
        adminUserId,
        ip,
        login,
        password: ''
      })

      expect(updated).toMatchObject({ ip, login, password: saved.password })
    })

    test('Requires a password when there are no saved credentials', async () => {
      const { id: adminUserId } = await adminUserModel.create()
      const { ip, login } = createCredentials()

      await expect(
        deviceCredentialsModel.upsert({ adminUserId, ip, login, password: '' })
      ).rejects.toThrow(ZodError)
    })
  })
})
