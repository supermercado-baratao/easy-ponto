import { faker } from '@faker-js/faker'
import { verifyPassword } from 'better-auth/crypto'
import { sql } from 'drizzle-orm'
import { CPF } from 'validation-br/cpf'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { database } from '@/infra/database/client'
import type { User } from '@/infra/database/types'
import { accountModel } from '@/models/account/model'
import { getDefaultPassword, OWNER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator, { MOCKED_ADMIN } from '@/tests/orchestrator'

const findAccount = async (
  authUserId: string
): Promise<{ mustChangePassword: boolean; password: string }> => {
  const [account] = await database.execute<{
    mustChangePassword: boolean
    password: string
  }>(
    sql`
      SELECT auth_users.must_change_password AS "mustChangePassword",
        auth_accounts.password
      FROM auth_users
      JOIN auth_accounts ON auth_accounts.user_id = auth_users.id
      WHERE auth_users.id = ${authUserId}
    `,
    'objects'
  )
  return account
}

const createEmployee = async (companyId: string): Promise<User> => {
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 1), companyId).map((user) => ({
      ...user,
      cpf: CPF.fake().value
    }))
  )
  await accountModel.createEmployeeAccounts(companyId)
  const [employee] = await userModel.findManyByCompanyId(companyId)
  return employee
}

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
})

describe('Account Model', () => {
  describe('setup', () => {
    test('Creates the company with its owner', async () => {
      const { company } = await accountModel.setup({
        ...MOCKED_ADMIN,
        passwordConfirmation: MOCKED_ADMIN.password
      })

      expect(company.name).toBe(MOCKED_ADMIN.companyName)
      expect(await accountModel.isSetUp()).toBe(true)
    })

    test('Refuses a second setup', async () => {
      await accountModel.setup({
        ...MOCKED_ADMIN,
        passwordConfirmation: MOCKED_ADMIN.password
      })

      await expect(
        accountModel.setup({
          ...MOCKED_ADMIN,
          email: faker.internet.email(),
          passwordConfirmation: MOCKED_ADMIN.password
        })
      ).rejects.toThrow()
    })

    test('Makes the owner a member of the company', async () => {
      await accountModel.setup({
        ...MOCKED_ADMIN,
        passwordConfirmation: MOCKED_ADMIN.password
      })
      const companyId = await orchestrator.findMockedCompanyId()

      const [{ authUserId }] = await database.execute<{ authUserId: string }>(
        sql`SELECT id AS "authUserId" FROM auth_users WHERE email = ${MOCKED_ADMIN.email}`,
        'objects'
      )
      const memberships = await accountModel.findMemberships(authUserId)
      expect(
        memberships.map(({ organizationId, role }) => [organizationId, role])
      ).toEqual([[companyId, OWNER_ROLE]])
    })
  })

  describe('resetEmployeePassword', () => {
    test('Restores the default password and requires a new one', async () => {
      const { id: companyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )
      const employee = await createEmployee(companyId)
      await accountModel.completePasswordChange(employee.authUserId!)

      await accountModel.resetEmployeePassword({
        companyId,
        userId: employee.id
      })

      const account = await findAccount(employee.authUserId!)
      expect(account.mustChangePassword).toBe(true)
      expect(
        await verifyPassword({
          hash: account.password,
          password: getDefaultPassword(employee.name, employee.cpf!)
        })
      ).toBe(true)
    })

    test('Refuses an employee of another company', async () => {
      const [{ id: companyId }, { id: otherCompanyId }] = await Promise.all([
        companyModel.create(orchestrator.createCompanyData()),
        companyModel.create(orchestrator.createCompanyData())
      ])
      const employee = await createEmployee(otherCompanyId)

      await expect(
        accountModel.resetEmployeePassword({ companyId, userId: employee.id })
      ).rejects.toThrow()
    })
  })
})
