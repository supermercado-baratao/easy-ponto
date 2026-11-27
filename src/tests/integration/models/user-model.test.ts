import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { EMPLOYEE_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { JobFunctionNotFoundError } from '@/models/job-function/errors'
import { jobFunctionModel } from '@/models/job-function/model'
import { userModel } from '@/models/user/model'
import { UserGroupNotFoundError } from '@/models/user-group/errors'
import { userGroupModel } from '@/models/user-group/model'
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

const createUser = async (
  companyId: string,
  authUserId: string | null = null
): Promise<string> => {
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
      authUserId
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
      ).rejects.toMatchObject({
        cause: `User ${id} not found in company ${companyId}`
      })

      const [user] = await userModel.findManyByCompanyId(otherCompanyId)
      expect(user.status).toBe('registered')
    })
  })

  describe('groups and functions', () => {
    test('Replaces the groups and the functions of the employee', async () => {
      const id = await createUser(companyId)
      const [front, night] = await Promise.all([
        userGroupModel.create({ companyId, name: 'Frente de caixa' }),
        userGroupModel.create({ companyId, name: 'Turno da noite' })
      ])
      const [supervisor, packer] = await Promise.all([
        jobFunctionModel.create({ companyId, name: 'Supervisor', level: '3' }),
        jobFunctionModel.create({ companyId, name: 'Empacotador', level: '1' })
      ])

      await userModel.update({
        id,
        companyId,
        status: 'registered',
        position: 'Caixa',
        payrollPositionActive: 'false',
        groupIds: [front.id, night.id],
        jobFunctionIds: [supervisor.id, packer.id],
        activeJobFunctionIds: [supervisor.id]
      })
      await userModel.update({
        id,
        companyId,
        status: 'registered',
        position: 'Caixa',
        payrollPositionActive: 'false',
        groupIds: [night.id],
        jobFunctionIds: [supervisor.id, packer.id],
        activeJobFunctionIds: [supervisor.id]
      })

      const { users } = await userModel.findManyWithOrganization(companyId)
      expect(users.find((user) => user.id === id)).toMatchObject({
        payrollPositionActive: false,
        groupIds: [night.id],
        jobFunctions: expect.arrayContaining([
          { jobFunctionId: supervisor.id, active: true },
          { jobFunctionId: packer.id, active: false }
        ])
      })
    })

    test('Does not save the function of the payroll position as another function', async () => {
      const id = await createUser(companyId)
      const stocker = await jobFunctionModel.create({
        companyId,
        name: 'Repositor de frios',
        level: '1'
      })

      await userModel.update({
        id,
        companyId,
        status: 'registered',
        position: 'repositor de frios',
        jobFunctionIds: [stocker.id]
      })

      const { users } = await userModel.findManyWithOrganization(companyId)
      expect(users.find((user) => user.id === id)?.jobFunctions).toEqual([])
    })

    test('Refuses a group or a function of another company', async () => {
      const id = await createUser(companyId)
      const group = await userGroupModel.create({
        companyId: otherCompanyId,
        name: 'Depósito'
      })
      const jobFunction = await jobFunctionModel.create({
        companyId: otherCompanyId,
        name: 'Conferente',
        level: '1'
      })

      await expect(
        userModel.update({
          id,
          companyId,
          status: 'registered',
          groupIds: [group.id]
        })
      ).rejects.toBeInstanceOf(UserGroupNotFoundError)
      await expect(
        userModel.update({
          id,
          companyId,
          status: 'registered',
          jobFunctionIds: [jobFunction.id]
        })
      ).rejects.toBeInstanceOf(JobFunctionNotFoundError)
    })
  })

  describe('findByAuthUserId', () => {
    test('Returns the employee linked to the account only in their company', async () => {
      const authUserId = await orchestrator.createMember({
        companyId,
        role: EMPLOYEE_ROLE,
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password({ length: 12 })
      })
      const id = await createUser(companyId, authUserId)

      await expect(
        userModel.findByAuthUserId({ companyId, authUserId })
      ).resolves.toMatchObject({ id, authUserId })
      await expect(
        userModel.findByAuthUserId({ companyId: otherCompanyId, authUserId })
      ).resolves.toBeNull()
    })
  })
})
