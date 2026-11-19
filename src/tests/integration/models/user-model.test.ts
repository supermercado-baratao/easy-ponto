import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import { userModel } from '@/models/user/model'
import orchestrator from '@/tests/orchestrator'

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.create({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  return id
}

const createUser = async (companyId: string): Promise<string> => {
  const pis = faker.string.numeric(12)
  await userModel.createMany([
    {
      name: faker.person.fullName(),
      pis,
      cpf: null,
      code: '1',
      templatesCount: 0,
      password: '',
      rfid: '0',
      bars: '',
      registration: '1',
      payrollNumber: '10',
      admissionDate: new Date('2025-03-01T00:00:00.000Z'),
      position: 'Caixa',
      department: 'Frente de loja',
      status: 'registered',
      companyId,
      authUserId: null
    }
  ])
  const users = await userModel.findManyByCompanyId(companyId)
  return users.find((user) => user.pis === pis)!.id
}

let companyId: string
let otherCompanyId: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  companyId = await createCompany()
  otherCompanyId = await createCompany()
})

describe('User Model', () => {
  describe('update', () => {
    test('Saves the status and the fields typed in the form', async () => {
      const id = await createUser(companyId)

      const user = await userModel.update({
        id,
        companyId,
        status: 'dismissed',
        position: ' Repositor ',
        department: '',
        payrollNumber: '20',
        admissionDate: '2025-04-10'
      })

      expect(user).toMatchObject({
        id,
        status: 'dismissed',
        position: 'Repositor',
        department: null,
        payrollNumber: '20',
        admissionDate: new Date('2025-04-10T00:00:00.000Z')
      })
    })

    test('Clears the admission date when it is left empty', async () => {
      const id = await createUser(companyId)

      const user = await userModel.update({
        id,
        companyId,
        status: 'registered',
        admissionDate: ''
      })

      expect(user.admissionDate).toBeNull()
    })

    test('Refuses an unknown status', async () => {
      const id = await createUser(companyId)

      await expect(
        userModel.update({ id, companyId, status: 'retired' as 'registered' })
      ).rejects.toMatchObject({
        name: z.ZodError.name,
        issues: [expect.objectContaining({ path: ['status'] })]
      })
    })

    test('Does not update a user of another company', async () => {
      const id = await createUser(otherCompanyId)

      await expect(
        userModel.update({ id, companyId, status: 'dismissed' })
      ).rejects.toThrow(`User ${id} not found in company ${companyId}`)

      const [user] = await userModel.findManyByCompanyId(otherCompanyId)
      expect(user.status).toBe('registered')
    })
  })
})
