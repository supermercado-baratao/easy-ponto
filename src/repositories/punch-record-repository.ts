import { database } from '@/infra/database/client'
import type { PunchRecord, TInputData } from '@/infra/database/types'

type TPunchRecordInsert = Pick<PunchRecord, 'pis' | 'datetime'> &
  Partial<TInputData<PunchRecord>>

type TPunchRecordFilters = {
  initialDate?: Date
  finalDate?: Date
  initialNsr?: number | null
  finalNsr?: number | null
  pis?: string | null
}

const punchRecords = database.orm.public.PunchRecord

// Keeps each INSERT below the 65,535 parameters accepted by Postgres
const INSERT_BATCH_SIZE = 5000

const toBatches = <T>(items: readonly T[]): T[][] =>
  Array.from(
    { length: Math.ceil(items.length / INSERT_BATCH_SIZE) },
    (_, index) =>
      items.slice(index * INSERT_BATCH_SIZE, (index + 1) * INSERT_BATCH_SIZE)
  )

export const punchRecordRepository = {
  create: async (data: TPunchRecordInsert): Promise<PunchRecord> =>
    await punchRecords.create(data),

  createMany: async (data: TPunchRecordInsert[]): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const batch of toBatches(data)) {
        await tx.orm.public.PunchRecord.createAndCount(batch)
      }
    })
  },

  createManySkippingSavedNsrs: async (
    data: TPunchRecordInsert[]
  ): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const batch of toBatches(data)) {
        await tx.orm.public.PunchRecord.createAndCount(batch, {
          onConflict: 'skip',
          conflictOn: ['nsr']
        })
      }
    })
  },

  findManyByPisList: async (pisList: string[]): Promise<PunchRecord[]> =>
    await punchRecords.where((record) => record.pis.in(pisList)).all(),

  findMany: async ({
    initialDate,
    finalDate,
    initialNsr,
    finalNsr,
    pis
  }: TPunchRecordFilters): Promise<PunchRecord[]> => {
    let query = punchRecords.where({})

    if (initialDate) {
      query = query.where((record) => record.datetime.gte(initialDate))
    }
    if (finalDate) {
      query = query.where((record) => record.datetime.lte(finalDate))
    }
    if (initialNsr) query = query.where((record) => record.nsr.gte(initialNsr))
    if (finalNsr) query = query.where((record) => record.nsr.lte(finalNsr))
    if (pis) query = query.where({ pis })

    return await query.all()
  },

  update: async (
    id: string,
    data: Pick<PunchRecord, 'datetime'>
  ): Promise<PunchRecord | null> =>
    await punchRecords.where({ id }).update(data),

  updateMany: async (
    data: Pick<PunchRecord, 'id' | 'datetime'>[]
  ): Promise<void> => {
    await database.transaction(async (tx) => {
      for (const { id, datetime } of data) {
        const updated = await tx.orm.public.PunchRecord.where({ id }).update({
          datetime
        })
        if (!updated) throw new Error(`PunchRecord ${id} not found`)
      }
    })
  },

  delete: async (id: string): Promise<PunchRecord | null> =>
    await punchRecords.where({ id }).delete()
}
