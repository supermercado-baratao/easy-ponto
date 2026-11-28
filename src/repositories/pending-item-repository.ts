import { and, eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { authUsers, pendingItemDismissals } from '@/infra/database/schema'
import type { PendingItemDismissal } from '@/infra/database/types'

type TDismissalKey = { companyId: string; key: string }

export type TDismissalWithAuthor = Pick<
  PendingItemDismissal,
  'key' | 'createdAt'
> & { dismissedByName: string | null }

export const pendingItemRepository = {
  findDismissalsByCompanyId: async (
    companyId: string
  ): Promise<TDismissalWithAuthor[]> =>
    await database
      .select({
        key: pendingItemDismissals.key,
        createdAt: pendingItemDismissals.createdAt,
        dismissedByName: authUsers.name
      })
      .from(pendingItemDismissals)
      .leftJoin(
        authUsers,
        eq(authUsers.id, pendingItemDismissals.dismissedById)
      )
      .where(eq(pendingItemDismissals.companyId, companyId)),

  dismiss: async (
    data: TDismissalKey & { dismissedById: string }
  ): Promise<PendingItemDismissal> => {
    const [dismissal] = await database
      .insert(pendingItemDismissals)
      .values(data)
      .onConflictDoUpdate({
        target: [pendingItemDismissals.companyId, pendingItemDismissals.key],
        set: { dismissedById: data.dismissedById }
      })
      .returning()
    return dismissal
  },

  restore: async ({
    companyId,
    key
  }: TDismissalKey): Promise<PendingItemDismissal | null> => {
    const [dismissal = null] = await database
      .delete(pendingItemDismissals)
      .where(
        and(
          eq(pendingItemDismissals.companyId, companyId),
          eq(pendingItemDismissals.key, key)
        )
      )
      .returning()
    return dismissal
  }
}
