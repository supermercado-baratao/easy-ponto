import { and, asc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { punchRecords } from '@/infra/database/schema'
import type { PunchRecord, TInputData } from '@/infra/database/types'

type TPunchRecordInsert = Pick<PunchRecord, 'pis' | 'datetime'> &
  Partial<TInputData<PunchRecord>>

type TPunchRecordFilters = {
  initialDate?: Date
  finalDate?: Date
  initialNsr?: number | null
  finalNsr?: number | null
  pis?: string | null
  pisList?: string[]
}

// Keeps each INSERT below the 65,535 parameters accepted by Postgres
const INSERT_BATCH_SIZE = 5000

const toBatches = <T>(items: readonly T[]): T[][] =>
  Array.from(
    { length: Math.ceil(items.length / INSERT_BATCH_SIZE) },
    (_, index) =>
      items.slice(index * INSERT_BATCH_SIZE, (index + 1) * INSERT_BATCH_SIZE)
  )

export const punchRecordRepository = {
  create: async (data: TPunchRecordInsert): Promise<PunchRecord> => {
    const [record] = await database
      .insert(punchRecords)
      .values(data)
      .returning()
    return record
  },

  createMany: async (
    data: TPunchRecordInsert[],
    transaction?: TTransaction
  ): Promise<void> => {
    await runInTransaction(transaction, async (tx) => {
      for (const batch of toBatches(data)) {
        await tx.insert(punchRecords).values(batch)
      }
    })
  },

  createManySkippingSavedNsrs: async (
    data: TPunchRecordInsert[]
  ): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const batch of toBatches(data)) {
        await tx
          .insert(punchRecords)
          .values(batch)
          .onConflictDoNothing({ target: punchRecords.nsr })
      }
    })
  },

  findManyByPisList: async (pisList: string[]): Promise<PunchRecord[]> =>
    await database
      .select()
      .from(punchRecords)
      .where(inArray(punchRecords.pis, pisList)),

  findMany: async ({
    initialDate,
    finalDate,
    initialNsr,
    finalNsr,
    pis,
    pisList
  }: TPunchRecordFilters): Promise<PunchRecord[]> => {
    const conditions: SQL[] = []

    if (initialDate) conditions.push(gte(punchRecords.datetime, initialDate))
    if (finalDate) conditions.push(lte(punchRecords.datetime, finalDate))
    if (initialNsr) conditions.push(gte(punchRecords.nsr, initialNsr))
    if (finalNsr) conditions.push(lte(punchRecords.nsr, finalNsr))
    if (pis) conditions.push(eq(punchRecords.pis, pis))
    if (pisList) conditions.push(inArray(punchRecords.pis, pisList))

    return await database
      .select()
      .from(punchRecords)
      .where(and(...conditions))
      .orderBy(asc(punchRecords.datetime))
  },

  update: async (
    id: string,
    data: Pick<PunchRecord, 'datetime'>
  ): Promise<PunchRecord | null> => {
    const [record = null] = await database
      .update(punchRecords)
      .set(data)
      .where(eq(punchRecords.id, id))
      .returning()
    return record
  },

  updateMany: async (
    data: Pick<PunchRecord, 'id' | 'datetime'>[]
  ): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const { id, datetime } of data) {
        const [updated] = await tx
          .update(punchRecords)
          .set({ datetime })
          .where(eq(punchRecords.id, id))
          .returning({ id: punchRecords.id })
        if (!updated) throw new Error(`PunchRecord ${id} not found`)
      }
    })
  },

  delete: async (id: string): Promise<PunchRecord | null> => {
    const [record = null] = await database
      .delete(punchRecords)
      .where(eq(punchRecords.id, id))
      .returning()
    return record
  }
}
