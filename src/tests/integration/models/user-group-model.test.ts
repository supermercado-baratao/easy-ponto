import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import {
  UserGroupHasChildrenError,
  UserGroupNotFoundError
} from '@/models/user-group/errors'
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

const fieldError = (path: string): unknown =>
  expect.objectContaining({
    name: z.ZodError.name,
    issues: [expect.objectContaining({ path: [path] })]
  })

let companyId: string
let otherCompanyId: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  companyId = await createCompany()
  otherCompanyId = await createCompany()
})

describe('User Group Model', () => {
  test('Saves a group inside another one', async () => {
    const sector = await userGroupModel.create({
      companyId,
      name: ' Reposição '
    })
    const section = await userGroupModel.create({
      companyId,
      name: 'Cereais',
      parentId: sector.id
    })

    expect(sector).toMatchObject({ name: 'Reposição', parentId: null })
    expect(section.parentId).toBe(sector.id)
  })

  test('Refuses a name already taken in the company, whatever the case', async () => {
    await userGroupModel.create({ companyId, name: 'Caixa' })

    await expect(
      userGroupModel.create({ companyId, name: 'CAIXA' })
    ).rejects.toEqual(fieldError('name'))
    await expect(
      userGroupModel.create({ companyId: otherCompanyId, name: 'Caixa' })
    ).resolves.toMatchObject({ name: 'Caixa' })
  })

  test('Refuses a group inside itself', async () => {
    const group = await userGroupModel.create({ companyId, name: 'Padaria' })

    await expect(
      userGroupModel.update({
        id: group.id,
        companyId,
        name: group.name,
        parentId: group.id
      })
    ).rejects.toEqual(fieldError('parentId'))
  })

  test('Refuses a group inside one of the groups inside it', async () => {
    const sector = await userGroupModel.create({ companyId, name: 'Açougue' })
    const section = await userGroupModel.create({
      companyId,
      name: 'Aves',
      parentId: sector.id
    })
    const subsection = await userGroupModel.create({
      companyId,
      name: 'Cortes de frango',
      parentId: section.id
    })

    await expect(
      userGroupModel.update({
        id: sector.id,
        companyId,
        name: sector.name,
        parentId: subsection.id
      })
    ).rejects.toEqual(fieldError('parentId'))
  })

  test('Refuses a group above that belongs to another company', async () => {
    const other = await userGroupModel.create({
      companyId: otherCompanyId,
      name: 'Hortifrúti'
    })

    await expect(
      userGroupModel.create({ companyId, name: 'Frutas', parentId: other.id })
    ).rejects.toBeInstanceOf(UserGroupNotFoundError)
  })

  test('Refuses to remove a group with groups inside it', async () => {
    const sector = await userGroupModel.create({ companyId, name: 'Frios' })
    const section = await userGroupModel.create({
      companyId,
      name: 'Laticínios',
      parentId: sector.id
    })

    await expect(
      userGroupModel.remove({ id: sector.id, companyId })
    ).rejects.toBeInstanceOf(UserGroupHasChildrenError)

    await userGroupModel.remove({ id: section.id, companyId })
    await userGroupModel.remove({ id: sector.id, companyId })
    const groups = await userGroupModel.findManyByCompanyId(companyId)
    expect(groups.map(({ id }) => id)).not.toContain(sector.id)
  })

  test('Does not remove a group of another company', async () => {
    const group = await userGroupModel.create({
      companyId: otherCompanyId,
      name: 'Mercearia'
    })

    await expect(
      userGroupModel.remove({ id: group.id, companyId })
    ).rejects.toBeInstanceOf(UserGroupNotFoundError)
  })
})
