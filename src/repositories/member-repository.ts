import { and, eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { authSessions, members } from '@/infra/database/schema'
import type { Member, TMemberWithUser } from '@/infra/database/types'

import { createAccount, type TAuthUserInsert } from './account-repository'

export const memberRepository = {
  findManyByCompanyId: async (companyId: string): Promise<TMemberWithUser[]> =>
    await database.query.members.findMany({
      where: { organizationId: companyId },
      with: { user: true },
      orderBy: { createdAt: 'asc' }
    }),

  findUniqueById: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<TMemberWithUser | null> =>
    (await database.query.members.findFirst({
      where: { id, organizationId: companyId },
      with: { user: true }
    })) ?? null,

  create: async ({
    companyId,
    role,
    user,
    passwordHash
  }: {
    companyId: string
    role: string
    user: TAuthUserInsert
    passwordHash: string
  }): Promise<Member | null> =>
    await database.transaction(async (tx) => {
      const saved = await tx.query.authUsers.findFirst({
        where: { email: user.email }
      })
      const account = saved ?? (await createAccount(tx, user, passwordHash))
      const [member = null] = await tx
        .insert(members)
        .values({ organizationId: companyId, userId: account.id, role })
        .onConflictDoNothing()
        .returning()
      return member
    }),

  updateRole: async ({
    id,
    companyId,
    role
  }: {
    id: string
    companyId: string
    role: string
  }): Promise<void> => {
    await database
      .update(members)
      .set({ role })
      .where(and(eq(members.id, id), eq(members.organizationId, companyId)))
  },

  transferOwnership: async ({
    companyId,
    fromId,
    toId,
    ownerRole,
    previousOwnerRole
  }: {
    companyId: string
    fromId: string
    toId: string
    ownerRole: string
    previousOwnerRole: string
  }): Promise<void> => {
    await database.transaction(async (tx) => {
      await tx
        .update(members)
        .set({ role: previousOwnerRole })
        .where(
          and(eq(members.id, fromId), eq(members.organizationId, companyId))
        )
      await tx
        .update(members)
        .set({ role: ownerRole })
        .where(and(eq(members.id, toId), eq(members.organizationId, companyId)))
    })
  },

  // The account may belong to other companies, so only the membership and the sessions open in this
  // company go away
  remove: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<void> => {
    await database.transaction(async (tx) => {
      const [member] = await tx
        .delete(members)
        .where(and(eq(members.id, id), eq(members.organizationId, companyId)))
        .returning()
      if (!member) return
      await tx
        .delete(authSessions)
        .where(
          and(
            eq(authSessions.userId, member.userId),
            eq(authSessions.activeOrganizationId, companyId)
          )
        )
    })
  }
}
