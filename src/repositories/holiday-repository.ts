import { and, eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { holidays } from '@/infra/database/schema'
import type { Holiday, TInputData } from '@/infra/database/types'

export const holidayRepository = {
  findManyByCompanyId: async (companyId: string): Promise<Holiday[]> =>
    await database.query.holidays.findMany({ where: { companyId } }),

  findById: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<Holiday | null> =>
    (await database.query.holidays.findFirst({ where: { id, companyId } })) ??
    null,

  create: async (data: TInputData<Holiday>): Promise<Holiday> => {
    const [holiday] = await database.insert(holidays).values(data).returning()
    return holiday
  },

  createMany: async (data: TInputData<Holiday>[]): Promise<number> => {
    const created = await database
      .insert(holidays)
      .values(data)
      .returning({ id: holidays.id })
    return created.length
  },

  update: async ({
    id,
    companyId,
    ...data
  }: TInputData<Holiday> & { id: string }): Promise<Holiday | null> => {
    const [holiday = null] = await database
      .update(holidays)
      .set(data)
      .where(and(eq(holidays.id, id), eq(holidays.companyId, companyId)))
      .returning()
    return holiday
  },

  end: async ({
    id,
    companyId,
    lastYear
  }: {
    id: string
    companyId: string
    lastYear: number
  }): Promise<Holiday | null> => {
    const [holiday = null] = await database
      .update(holidays)
      .set({ lastYear })
      .where(and(eq(holidays.id, id), eq(holidays.companyId, companyId)))
      .returning()
    return holiday
  },

  endAndCreate: async ({
    id,
    companyId,
    lastYear,
    data
  }: {
    id: string
    companyId: string
    lastYear: number
    data: TInputData<Holiday>
  }): Promise<Holiday> =>
    await database.transaction(async (tx) => {
      await tx
        .update(holidays)
        .set({ lastYear })
        .where(and(eq(holidays.id, id), eq(holidays.companyId, companyId)))
      const [holiday] = await tx.insert(holidays).values(data).returning()
      return holiday
    }),

  remove: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<Holiday | null> => {
    const [holiday = null] = await database
      .delete(holidays)
      .where(and(eq(holidays.id, id), eq(holidays.companyId, companyId)))
      .returning()
    return holiday
  }
}
