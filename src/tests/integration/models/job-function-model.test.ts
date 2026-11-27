import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import {
  JobFunctionInUseError,
  JobFunctionNotFoundError
} from '@/models/job-function/errors'
import { jobFunctionModel } from '@/models/job-function/model'
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

const createUser = async (
  companyId: string,
  position: string | null
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
      payrollNumber: null,
      admissionDate: null,
      position,
      department: null,
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

describe('Job Function Model', () => {
  test('Saves a function with its level', async () => {
    const jobFunction = await jobFunctionModel.create({
      companyId,
      name: ' Encarregado ',
      level: '3'
    })

    expect(jobFunction).toMatchObject({
      name: 'Encarregado',
      level: 3,
      description: null
    })
  })

  test('Refuses a name already taken in the company, whatever the case', async () => {
    await jobFunctionModel.create({ companyId, name: 'Fiscal', level: '2' })

    await expect(
      jobFunctionModel.create({ companyId, name: 'fiscal', level: '1' })
    ).rejects.toMatchObject({
      name: z.ZodError.name,
      issues: [expect.objectContaining({ path: ['name'] })]
    })
  })

  test('Refuses a level below 1', async () => {
    await expect(
      jobFunctionModel.create({ companyId, name: 'Estoquista', level: '0' })
    ).rejects.toMatchObject({
      name: z.ZodError.name,
      issues: [expect.objectContaining({ path: ['level'] })]
    })
  })

  test('Refuses to remove a function given to an employee', async () => {
    const jobFunction = await jobFunctionModel.create({
      companyId,
      name: 'Embalador',
      level: '1'
    })
    const userId = await createUser(companyId, null)
    await userModel.update({
      id: userId,
      companyId,
      status: 'registered',
      jobFunctionIds: [jobFunction.id]
    })

    await expect(
      jobFunctionModel.remove({ id: jobFunction.id, companyId })
    ).rejects.toBeInstanceOf(JobFunctionInUseError)

    await userModel.update({ id: userId, companyId, status: 'registered' })
    await expect(
      jobFunctionModel.remove({ id: jobFunction.id, companyId })
    ).resolves.toMatchObject({ id: jobFunction.id })
  })

  test('Does not remove a function of another company', async () => {
    const jobFunction = await jobFunctionModel.create({
      companyId: otherCompanyId,
      name: 'Padeiro',
      level: '1'
    })

    await expect(
      jobFunctionModel.remove({ id: jobFunction.id, companyId })
    ).rejects.toBeInstanceOf(JobFunctionNotFoundError)
  })

  test('Creates a function for each payroll position without one', async () => {
    const company = await createCompany()
    await jobFunctionModel.create({
      companyId: company,
      name: 'Repositor',
      level: '2'
    })
    await createUser(company, 'repositor')
    await createUser(company, 'Açougueiro')
    await createUser(company, 'açougueiro')
    await createUser(company, null)

    const created = await jobFunctionModel.createFromPayrollPositions(company)

    expect(created).toEqual([
      expect.objectContaining({
        name: expect.stringMatching(/^açougueiro$/i),
        level: 1
      })
    ])
    await expect(
      jobFunctionModel.createFromPayrollPositions(company)
    ).resolves.toEqual([])
  })
})
