import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import type { User } from '@/infra/database/types'
import { companyModel } from '@/models/company/model'
import { justificationModel } from '@/models/justification/model'
import { justificationTypeModel } from '@/models/justification-type/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { vacationPlanModel } from '@/models/vacation-plan/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const YEAR = 2027

const createCompanyWithUsers = async (
  start: number,
  end: number
): Promise<{ companyId: string; users: User[] }> => {
  const { id: companyId } = await companyModel.create({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(start, end), companyId)
  )
  return { companyId, users: await userModel.findManyByCompanyId(companyId) }
}

let companyId: string
let users: User[]
let otherCompanyId: string
let otherUser: User
let typeId: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  ;({ companyId, users } = await createCompanyWithUsers(0, 3))
  const other = await createCompanyWithUsers(3, 4)
  otherCompanyId = other.companyId
  otherUser = other.users[0]
  ;({ id: typeId } = await justificationTypeModel.create({
    companyId,
    code: 'FERIAS',
    description: 'Férias',
    effect: 'excuse'
  }))
})

const findPlans = async (): Promise<Record<string, number | undefined>> => {
  const rows = await vacationPlanModel.findManyByYear({ companyId, year: YEAR })
  return Object.fromEntries(
    rows.map(({ user, plan }) => [user.id, plan?.month])
  )
}

describe('Vacation Plan Model', () => {
  test('Plans, changes and removes the month of each employee', async () => {
    const [first, second] = users
    await vacationPlanModel.save({
      companyId,
      userId: first.id,
      year: YEAR,
      month: '7'
    })
    await vacationPlanModel.save({
      companyId,
      userId: second.id,
      year: YEAR,
      month: '1'
    })
    await vacationPlanModel.save({
      companyId,
      userId: first.id,
      year: YEAR,
      month: '8'
    })
    expect(await findPlans()).toEqual({
      [first.id]: 8,
      [second.id]: 1,
      [users[2].id]: undefined
    })

    await vacationPlanModel.save({
      companyId,
      userId: second.id,
      year: YEAR,
      month: ''
    })
    const plans = await findPlans()
    expect(plans[second.id]).toBeUndefined()
    const nextYear = await vacationPlanModel.findManyByYear({
      companyId,
      year: YEAR + 1
    })
    expect(nextYear.map(({ plan }) => plan)).toEqual([null, null, null])
  })

  test('Lists a dismissed employee only when the vacation is planned', async () => {
    const [first, , third] = users
    for (const user of [first, third]) {
      await userModel.update({
        id: user.id,
        companyId,
        status: 'dismissed'
      })
    }
    expect(Object.keys(await findPlans())).toEqual(
      users.slice(0, 2).map(({ id }) => id)
    )
    for (const user of [first, third]) {
      await userModel.update({
        id: user.id,
        companyId,
        status: 'registered'
      })
    }
  })

  test('Rejects an employee of another company', async () => {
    await expect(
      vacationPlanModel.save({
        companyId,
        userId: otherUser.id,
        year: YEAR,
        month: '3'
      })
    ).rejects.toThrow(`User ${otherUser.id} not found in company ${companyId}`)
    expect(
      await vacationPlanModel.findManyByYear({
        companyId: otherCompanyId,
        year: YEAR
      })
    ).toEqual([{ user: otherUser, plan: null }])
  })

  test('Registers the planned vacation as a justification', async () => {
    const [first] = users
    const justification = await vacationPlanModel.registerJustification({
      companyId,
      userId: first.id,
      year: YEAR,
      typeId,
      startDate: '2027-08-02',
      endDate: '2027-08-31',
      note: ''
    })

    const rows = await vacationPlanModel.findManyByYear({
      companyId,
      year: YEAR
    })
    const plan = rows.find(({ user }) => user.id === first.id)?.plan
    expect(plan?.justification).toMatchObject({
      id: justification.id,
      startDate: '2027-08-02',
      endDate: '2027-08-31',
      startTime: null,
      endTime: null,
      type: { code: 'FERIAS' }
    })

    await expect(
      vacationPlanModel.registerJustification({
        companyId,
        userId: first.id,
        year: YEAR,
        typeId,
        startDate: '2027-08-02',
        endDate: '2027-08-31',
        note: ''
      })
    ).rejects.toThrow(
      `The vacation of user ${first.id} in ${YEAR} is already registered`
    )
  })

  test('Keeps the month of a registered vacation until its justification is removed', async () => {
    const [first] = users
    const promise = vacationPlanModel.save({
      companyId,
      userId: first.id,
      year: YEAR,
      month: '9'
    })
    await expect(promise).rejects.toThrow(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [{ path: ['month'] }]
    })

    const rows = await vacationPlanModel.findManyByYear({
      companyId,
      year: YEAR
    })
    const justificationId = rows.find(({ user }) => user.id === first.id)?.plan
      ?.justificationId
    await justificationModel.remove({ id: justificationId!, companyId })

    await vacationPlanModel.save({
      companyId,
      userId: first.id,
      year: YEAR,
      month: '9'
    })
    const plans = await findPlans()
    expect(plans[first.id]).toBe(9)
  })

  test('Rejects registering a vacation that was not planned', async () => {
    const [, second] = users
    await expect(
      vacationPlanModel.registerJustification({
        companyId,
        userId: second.id,
        year: YEAR,
        typeId,
        startDate: '2027-01-04',
        endDate: '2027-01-31',
        note: ''
      })
    ).rejects.toThrow(`User ${second.id} has no vacation planned in ${YEAR}`)
  })

  test('Rejects a justification type of another company and keeps the vacation unregistered', async () => {
    await vacationPlanModel.save({
      companyId: otherCompanyId,
      userId: otherUser.id,
      year: YEAR,
      month: '5'
    })
    await expect(
      vacationPlanModel.registerJustification({
        companyId: otherCompanyId,
        userId: otherUser.id,
        year: YEAR,
        typeId,
        startDate: '2027-05-03',
        endDate: '2027-05-31',
        note: ''
      })
    ).rejects.toThrow(
      `JustificationType ${typeId} not found in company ${otherCompanyId}`
    )
    const [{ plan }] = await vacationPlanModel.findManyByYear({
      companyId: otherCompanyId,
      year: YEAR
    })
    expect(plan?.justificationId).toBeNull()
  })
})
