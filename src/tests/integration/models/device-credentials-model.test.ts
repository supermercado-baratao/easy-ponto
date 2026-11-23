import { faker } from '@faker-js/faker'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { ZodError } from 'zod'

import { companyModel } from '@/models/company/model'
import { DEFAULT_DEVICE_MODEL } from '@/models/device/utils'
import { deviceCredentialsModel } from '@/models/device-credentials/model'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
})

const createCredentials = () => ({
  model: DEFAULT_DEVICE_MODEL,
  ip: faker.internet.ipv4(),
  login: faker.internet.username(),
  password: faker.internet.password()
})

describe('Device Credentials Model', () => {
  describe('upsert', () => {
    test('Links the new credentials to the company', async () => {
      const { id: companyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )

      const credentials = await deviceCredentialsModel.upsert({
        companyId,
        ...createCredentials()
      })

      const company = await companyModel.findUniqueById(companyId)
      expect(company.deviceCredentialsId).toBe(credentials.id)
    })

    test('Updates the credentials the company already has', async () => {
      const { id: companyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )
      const saved = await deviceCredentialsModel.upsert({
        companyId,
        ...createCredentials()
      })
      const changes = createCredentials()

      const updated = await deviceCredentialsModel.upsert({
        companyId,
        ...changes
      })

      expect(updated).toMatchObject({ id: saved.id, ...changes })
    })

    test('Keeps the saved password when none is sent', async () => {
      const { id: companyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )
      const saved = await deviceCredentialsModel.upsert({
        companyId,
        ...createCredentials()
      })
      const { model, ip, login } = createCredentials()

      const updated = await deviceCredentialsModel.upsert({
        companyId,
        model,
        ip,
        login,
        password: ''
      })

      expect(updated).toMatchObject({ ip, login, password: saved.password })
    })

    test('Requires a password when there are no saved credentials', async () => {
      const { id: companyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )
      const { model, ip, login } = createCredentials()

      await expect(
        deviceCredentialsModel.upsert({
          companyId,
          model,
          ip,
          login,
          password: ''
        })
      ).rejects.toThrow(ZodError)
    })
  })
})
