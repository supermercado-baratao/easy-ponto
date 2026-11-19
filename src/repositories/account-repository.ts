import { and, count, eq } from 'drizzle-orm'

import { database, type TTransaction } from '@/infra/database/client'
import {
  authAccounts,
  authSessions,
  authUsers,
  companies,
  members,
  users
} from '@/infra/database/schema'
import type {
  AuthUser,
  Company,
  TMemberWithCompany
} from '@/infra/database/types'

// The provider better-auth gives to the email and password accounts
const CREDENTIAL_PROVIDER_ID = 'credential'

type TAuthUserInsert = Pick<AuthUser, 'name' | 'email' | 'mustChangePassword'>

type TEmployeeAccountInsert = {
  employeeId: string
  companyId: string
  role: string
  user: TAuthUserInsert
  passwordHash: string
}

const createAccount = async (
  tx: TTransaction,
  user: TAuthUserInsert,
  passwordHash: string
): Promise<AuthUser> => {
  const [created] = await tx.insert(authUsers).values(user).returning()
  await tx.insert(authAccounts).values({
    accountId: created.id,
    providerId: CREDENTIAL_PROVIDER_ID,
    userId: created.id,
    password: passwordHash
  })
  return created
}

export const accountRepository = {
  count: async (): Promise<number> => {
    const [{ total }] = await database
      .select({ total: count() })
      .from(authUsers)
    return total
  },

  createWithCompany: async ({
    company,
    user,
    role,
    passwordHash
  }: {
    company: Pick<Company, 'name' | 'slug'>
    user: TAuthUserInsert
    role: string
    passwordHash: string
  }): Promise<{ account: AuthUser; company: Company }> =>
    await database.transaction(async (tx) => {
      const [createdCompany] = await tx
        .insert(companies)
        .values(company)
        .returning()
      const account = await createAccount(tx, user, passwordHash)
      await tx.insert(members).values({
        organizationId: createdCompany.id,
        userId: account.id,
        role
      })
      return { account, company: createdCompany }
    }),

  createEmployeeAccounts: async (
    accounts: TEmployeeAccountInsert[]
  ): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const {
        employeeId,
        companyId,
        role,
        user,
        passwordHash
      } of accounts) {
        // The same CPF may already have an account from another company, which keeps its password
        const saved = await tx.query.authUsers.findFirst({
          where: { email: user.email }
        })
        const account = saved ?? (await createAccount(tx, user, passwordHash))
        await tx
          .update(users)
          .set({ authUserId: account.id })
          .where(and(eq(users.id, employeeId), eq(users.companyId, companyId)))
        await tx
          .insert(members)
          .values({ organizationId: companyId, userId: account.id, role })
          .onConflictDoNothing()
      }
    })
  },

  resetPassword: async ({
    authUserId,
    passwordHash
  }: {
    authUserId: string
    passwordHash: string
  }): Promise<void> => {
    await database.transaction(async (tx) => {
      await tx
        .update(authAccounts)
        .set({ password: passwordHash })
        .where(
          and(
            eq(authAccounts.userId, authUserId),
            eq(authAccounts.providerId, CREDENTIAL_PROVIDER_ID)
          )
        )
      await tx
        .update(authUsers)
        .set({ mustChangePassword: true })
        .where(eq(authUsers.id, authUserId))
      await tx.delete(authSessions).where(eq(authSessions.userId, authUserId))
    })
  },

  setMustChangePassword: async (
    authUserId: string,
    mustChangePassword: boolean
  ): Promise<void> => {
    await database
      .update(authUsers)
      .set({ mustChangePassword })
      .where(eq(authUsers.id, authUserId))
  },

  findMembership: async ({
    authUserId,
    companyId
  }: {
    authUserId: string
    companyId: string
  }): Promise<TMemberWithCompany | null> =>
    (await database.query.members.findFirst({
      where: { userId: authUserId, organizationId: companyId },
      with: { company: { with: { deviceCredentials: true } } }
    })) ?? null,

  findMemberships: async (authUserId: string): Promise<TMemberWithCompany[]> =>
    await database.query.members.findMany({
      where: { userId: authUserId },
      with: { company: { with: { deviceCredentials: true } } },
      orderBy: { createdAt: 'asc' }
    })
}
