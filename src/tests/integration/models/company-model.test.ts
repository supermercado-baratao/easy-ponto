import { beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { companyModel } from '@/models/company/model'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
})

describe('Company Model', () => {
  describe('save', () => {
    test('Replaces the data of the given company only', async () => {
      const [company, other] = await Promise.all([
        companyModel.create(orchestrator.createCompanyData()),
        companyModel.create(orchestrator.createCompanyData())
      ])
      const data = orchestrator.createCompanyData()

      const saved = await companyModel.save({ ...data, id: company.id })

      expect(saved).toMatchObject({ ...data, id: company.id })
      expect(await companyModel.findUniqueById(other.id)).toMatchObject({
        name: other.name,
        cpfCnpj: other.cpfCnpj
      })
    })
  })
})
