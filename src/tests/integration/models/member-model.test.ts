import { faker } from '@faker-js/faker'
import { verifyPassword } from 'better-auth/crypto'
import { sql } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { ZodError } from 'zod'

import { database } from '@/infra/database/client'
import { accountModel } from '@/models/account/model'
import { ADMIN_ROLE, OWNER_ROLE, VIEWER_ROLE } from '@/models/account/utils'
import { companyModel } from '@/models/company/model'
import { memberModel } from '@/models/member/model'
import type { TMember } from '@/models/member/types'
import orchestrator, { MOCKED_ADMIN } from '@/tests/orchestrator'

let companyId: string
let owner: { actorUserId: string; actorRole: string }

const createMemberData = (role: string = VIEWER_ROLE) => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  role,
  password: faker.internet.password({ length: 12 })
})

const findAccount = async (
  email: string
): Promise<{ name: string; mustChangePassword: boolean; password: string }> => {
  const [account] = await database.execute<{
    name: string
    mustChangePassword: boolean
    password: string
  }>(
    sql`
      SELECT auth_users.name,
        auth_users.must_change_password AS "mustChangePassword",
        auth_accounts.password
      FROM auth_users
      JOIN auth_accounts ON auth_accounts.user_id = auth_users.id
      WHERE auth_users.email = ${email}
    `,
    'objects'
  )
  return account
}

const addMember = async (
  role: string = VIEWER_ROLE,
  actor = owner
): Promise<TMember> => {
  const data = createMemberData(role)
  await memberModel.add({ ...actor, companyId, ...data })
  const members = await memberModel.findManyByCompanyId(companyId)
  return members.find(({ email }) => email === data.email)!
}

const asActor = (member: TMember) => ({
  actorUserId: member.userId,
  actorRole: member.role
})

const findRoles = async (): Promise<Record<string, string>> => {
  const members = await memberModel.findManyByCompanyId(companyId)
  return Object.fromEntries(members.map(({ id, role }) => [id, role]))
}

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
  await accountModel.setup({
    ...MOCKED_ADMIN,
    passwordConfirmation: MOCKED_ADMIN.password
  })
  companyId = await orchestrator.findMockedCompanyId()
  const [member] = await memberModel.findManyByCompanyId(companyId)
  owner = asActor(member)
})

describe('Member Model', () => {
  describe('findManyByCompanyId', () => {
    test('Leaves the employees out of the members', async () => {
      await orchestrator.createMember({
        ...createMemberData(),
        companyId,
        role: 'employee'
      })

      const members = await memberModel.findManyByCompanyId(companyId)

      expect(members.map(({ role }) => role)).toEqual([OWNER_ROLE])
    })
  })

  describe('add', () => {
    test('Creates an account with a temporary password that must be changed', async () => {
      const data = createMemberData(ADMIN_ROLE)

      await memberModel.add({ ...owner, companyId, ...data })

      const account = await findAccount(data.email)
      expect(account.mustChangePassword).toBe(true)
      expect(
        await verifyPassword({
          hash: account.password,
          password: data.password
        })
      ).toBe(true)
      const members = await memberModel.findManyByCompanyId(companyId)
      expect(members.find(({ email }) => email === data.email)?.role).toBe(
        ADMIN_ROLE
      )
    })

    test('Only adds an account of another company, keeping its name and password', async () => {
      const { id: otherCompanyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )
      const existing = createMemberData()
      await orchestrator.createMember({
        ...existing,
        companyId: otherCompanyId
      })

      await memberModel.add({
        ...owner,
        companyId,
        ...createMemberData(),
        email: existing.email
      })

      const account = await findAccount(existing.email)
      expect(account.name).toBe(existing.name)
      expect(account.mustChangePassword).toBe(false)
      expect(
        await verifyPassword({
          hash: account.password,
          password: existing.password
        })
      ).toBe(true)
      const members = await memberModel.findManyByCompanyId(companyId)
      expect(members.map(({ email }) => email)).toContain(existing.email)
    })

    test('Refuses an email that is already a member of the company', async () => {
      const data = createMemberData()
      await memberModel.add({ ...owner, companyId, ...data })

      await expect(
        memberModel.add({
          ...owner,
          companyId,
          ...createMemberData(),
          email: data.email
        })
      ).rejects.toThrow(ZodError)
    })

    test("Refuses an employee's email", async () => {
      await expect(
        memberModel.add({
          ...owner,
          companyId,
          ...createMemberData(),
          email: '12345678909@funcionario.invalid'
        })
      ).rejects.toThrow(ZodError)
    })

    test('Refuses the owner role', async () => {
      await expect(
        memberModel.add({
          ...owner,
          companyId,
          ...createMemberData(OWNER_ROLE)
        })
      ).rejects.toThrow(ZodError)
    })

    test('Lets the admin add only viewers', async () => {
      const admin = asActor(await addMember(ADMIN_ROLE))

      await expect(addMember(VIEWER_ROLE, admin)).resolves.toBeDefined()
      await expect(addMember(ADMIN_ROLE, admin)).rejects.toThrow()
    })
  })

  describe('changeRole', () => {
    test('Lets the owner promote a viewer and demote an admin', async () => {
      const viewer = await addMember(VIEWER_ROLE)
      const admin = await addMember(ADMIN_ROLE)

      await memberModel.changeRole({
        ...owner,
        companyId,
        id: viewer.id,
        role: ADMIN_ROLE
      })
      await memberModel.changeRole({
        ...owner,
        companyId,
        id: admin.id,
        role: VIEWER_ROLE
      })

      const roles = await findRoles()
      expect(roles[viewer.id]).toBe(ADMIN_ROLE)
      expect(roles[admin.id]).toBe(VIEWER_ROLE)
    })

    test('Refuses an admin promoting a viewer or demoting another admin', async () => {
      const admin = await addMember(ADMIN_ROLE)
      const otherAdmin = await addMember(ADMIN_ROLE)
      const viewer = await addMember(VIEWER_ROLE)

      await expect(
        memberModel.changeRole({
          ...asActor(admin),
          companyId,
          id: viewer.id,
          role: ADMIN_ROLE
        })
      ).rejects.toThrow()
      await expect(
        memberModel.changeRole({
          ...asActor(admin),
          companyId,
          id: otherAdmin.id,
          role: VIEWER_ROLE
        })
      ).rejects.toThrow()
    })

    test('Never changes the role of the owner', async () => {
      const [ownerMember] = await memberModel.findManyByCompanyId(companyId)

      await expect(
        memberModel.changeRole({
          ...owner,
          companyId,
          id: ownerMember.id,
          role: ADMIN_ROLE
        })
      ).rejects.toThrow()

      const roles = await findRoles()
      expect(roles[ownerMember.id]).toBe(OWNER_ROLE)
    })

    test('Refuses a member of another company', async () => {
      const { id: otherCompanyId } = await companyModel.create(
        orchestrator.createCompanyData()
      )
      const data = createMemberData()
      await orchestrator.createMember({ ...data, companyId: otherCompanyId })
      const [other] = await database.execute<{ id: string }>(
        sql`SELECT id FROM members WHERE company_id = ${otherCompanyId}`,
        'objects'
      )

      await expect(
        memberModel.changeRole({
          ...owner,
          companyId,
          id: other.id,
          role: ADMIN_ROLE
        })
      ).rejects.toThrow()
    })
  })

  describe('transferOwnership', () => {
    test('Makes the member the owner and the previous owner an admin', async () => {
      const [ownerMember] = await memberModel.findManyByCompanyId(companyId)
      const viewer = await addMember(VIEWER_ROLE)

      await memberModel.transferOwnership({
        ...owner,
        companyId,
        id: viewer.id
      })

      const roles = await findRoles()
      expect(roles[viewer.id]).toBe(OWNER_ROLE)
      expect(roles[ownerMember.id]).toBe(ADMIN_ROLE)
    })

    test('Refuses an admin transferring the ownership', async () => {
      const admin = await addMember(ADMIN_ROLE)
      const viewer = await addMember(VIEWER_ROLE)

      await expect(
        memberModel.transferOwnership({
          ...asActor(admin),
          companyId,
          id: viewer.id
        })
      ).rejects.toThrow()
    })
  })

  describe('remove', () => {
    test('Removes the member from the company and keeps the account', async () => {
      const viewer = await addMember(VIEWER_ROLE)

      await memberModel.remove({ ...owner, companyId, id: viewer.id })

      expect(await findRoles()).not.toHaveProperty(viewer.id)
      expect(await findAccount(viewer.email)).toBeDefined()
    })

    test('Never removes the owner', async () => {
      const [ownerMember] = await memberModel.findManyByCompanyId(companyId)
      const admin = await addMember(ADMIN_ROLE)

      await expect(
        memberModel.remove({ ...owner, companyId, id: ownerMember.id })
      ).rejects.toThrow()
      await expect(
        memberModel.remove({ ...asActor(admin), companyId, id: ownerMember.id })
      ).rejects.toThrow()

      const roles = await findRoles()
      expect(roles[ownerMember.id]).toBe(OWNER_ROLE)
    })

    test('Lets the admin remove only viewers', async () => {
      const admin = await addMember(ADMIN_ROLE)
      const otherAdmin = await addMember(ADMIN_ROLE)
      const viewer = await addMember(VIEWER_ROLE)

      await memberModel.remove({ ...asActor(admin), companyId, id: viewer.id })
      await expect(
        memberModel.remove({ ...asActor(admin), companyId, id: otherAdmin.id })
      ).rejects.toThrow()
    })
  })
})
