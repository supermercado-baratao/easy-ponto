import { and, eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { hoursBankBalances, hoursBankClosings } from '@/infra/database/schema'
import type {
  HoursBankBalance,
  HoursBankClosing,
  THoursBankClosingWithBalances,
  TInputData
} from '@/infra/database/types'

type THoursBankClosingSaveData = TInputData<HoursBankClosing> & {
  balances: Omit<TInputData<HoursBankBalance>, 'closingId'>[]
}

export const hoursBankClosingRepository = {
  findLast: async (companyId: string): Promise<HoursBankClosing | null> =>
    (await database.query.hoursBankClosings.findFirst({
      where: { companyId },
      orderBy: { endDate: 'desc' }
    })) ?? null,

  findLastEndedBefore: async ({
    companyId,
    date
  }: {
    companyId: string
    date: string
  }): Promise<THoursBankClosingWithBalances | null> =>
    (await database.query.hoursBankClosings.findFirst({
      where: { companyId, endDate: { lt: date } },
      with: { balances: { with: { user: true } } },
      orderBy: { endDate: 'desc' }
    })) ?? null,

  findUniqueByPeriod: async ({
    companyId,
    startDate,
    endDate
  }: {
    companyId: string
    startDate: string
    endDate: string
  }): Promise<THoursBankClosingWithBalances | null> =>
    (await database.query.hoursBankClosings.findFirst({
      where: { companyId, startDate, endDate },
      with: { balances: { with: { user: true } } }
    })) ?? null,

  create: async ({
    balances,
    ...closing
  }: THoursBankClosingSaveData): Promise<HoursBankClosing> =>
    await database.transaction(async (tx) => {
      const [created] = await tx
        .insert(hoursBankClosings)
        .values(closing)
        .returning()
      if (balances.length > 0) {
        await tx
          .insert(hoursBankBalances)
          .values(
            balances.map((balance) => ({ ...balance, closingId: created.id }))
          )
      }
      return created
    }),

  remove: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<HoursBankClosing | null> => {
    const [closing = null] = await database
      .delete(hoursBankClosings)
      .where(
        and(
          eq(hoursBankClosings.id, id),
          eq(hoursBankClosings.companyId, companyId)
        )
      )
      .returning()
    return closing
  }
}
