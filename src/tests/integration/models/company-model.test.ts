import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { adminUserModel } from '@/models/admin-user/model'
import { companyModel } from '@/models/company/model'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
})

describe('Company Model', () => {
  describe('upsertForAdminUser', () => {
    test('Links the saved company to the admin user', async () => {
      const { id: adminUserId } = await adminUserModel.create()

      const company = await companyModel.upsertForAdminUser({
        adminUserId,
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        cpf: CPF.fake().value,
        tipoDoc: 1,
        cpfCnpj: CNPJ.fake().value,
        cei: faker.string.numeric(12)
      })

      const adminUser = await adminUserModel.findUniqueById(adminUserId)
      expect(adminUser.company).toEqual(company)
    })
  })
})
