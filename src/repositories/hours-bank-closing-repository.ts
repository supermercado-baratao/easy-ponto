import { database } from '@/infra/database/client'
import type {
  HoursBankBalance,
  HoursBankClosing,
  THoursBankClosingWithBalances,
  TInputData
} from '@/infra/database/types'

type THoursBankClosingSaveData = TInputData<HoursBankClosing> & {
  balances: Omit<TInputData<HoursBankBalance>, 'closingId'>[]
}

const closings = database.orm.public.HoursBankClosing

export const hoursBankClosingRepository = {
  findLast: async (companyId: string): Promise<HoursBankClosing | null> =>
    await closings
      .where({ companyId })
      .orderBy((closing) => closing.endDate.desc())
      .first(),

  findLastEndedBefore: async ({
    companyId,
    date
  }: {
    companyId: string
    date: string
  }): Promise<THoursBankClosingWithBalances | null> =>
    await closings
      .where({ companyId })
      .where((closing) => closing.endDate.lt(date))
      .include('balances', (balances) => balances.include('user'))
      .orderBy((closing) => closing.endDate.desc())
      .first(),

  findUniqueByPeriod: async ({
    companyId,
    startDate,
    endDate
  }: {
    companyId: string
    startDate: string
    endDate: string
  }): Promise<THoursBankClosingWithBalances | null> =>
    await closings
      .where({ companyId, startDate, endDate })
      .include('balances', (balances) => balances.include('user'))
      .first(),

  create: async ({
    balances,
    ...closing
  }: THoursBankClosingSaveData): Promise<HoursBankClosing> =>
    await database.transaction(async (tx) => {
      const created = await tx.orm.public.HoursBankClosing.create(closing)
      if (balances.length > 0) {
        await tx.orm.public.HoursBankBalance.createAndCount(
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
  }): Promise<HoursBankClosing | null> =>
    await closings.where({ id, companyId }).delete()
}
