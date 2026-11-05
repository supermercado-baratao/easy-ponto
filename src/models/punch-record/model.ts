import { db } from '@/infra/database/client'
import type { PunchRecord } from '@/infra/database/types'

import {
  createManyExistentsInAfdSchema,
  createManyNonExistentsInAfdSchema,
  createNonExistentInAfdSchema,
  findManyParamsSchema,
  updateSchema
} from './schema'
import {
  TPunchRecordCreateManyExistentsInAfdData,
  TPunchRecordCreateNonExistentInAfdData,
  TPunchRecordFindManyParams,
  TPunchRecordUpdateData
} from './types'

const punchRecords = db.orm.public.PunchRecord

// Keeps each INSERT below the 65,535 parameters accepted by Postgres
const INSERT_BATCH_SIZE = 5000

const toBatches = <T>(items: readonly T[]): T[][] =>
  Array.from(
    { length: Math.ceil(items.length / INSERT_BATCH_SIZE) },
    (_, index) =>
      items.slice(index * INSERT_BATCH_SIZE, (index + 1) * INSERT_BATCH_SIZE)
  )

const getRecordKey = ({
  pis,
  datetime
}: {
  pis: string
  datetime: Date
}): string => `${pis}|${datetime.getTime()}`

const createNonExistentInAfd = async (
  data: TPunchRecordCreateNonExistentInAfdData
): Promise<PunchRecord> => {
  const validData = await createNonExistentInAfdSchema.parseAsync(data)
  const result = await punchRecords.create(validData)
  return result
}

const createManyNonExistentInAfd = async (
  data: TPunchRecordCreateNonExistentInAfdData[]
): Promise<void> => {
  const validData = await createManyNonExistentsInAfdSchema.parseAsync(data)
  const pisList = [...new Set(validData.map(({ pis }) => pis))]
  const savedRecords = await punchRecords
    .where((record) => record.pis.in(pisList))
    .all()
  const seenRecords = new Set(savedRecords.map(getRecordKey))
  const newRecords = validData.filter((record) => {
    const key = getRecordKey(record)
    if (seenRecords.has(key)) return false
    seenRecords.add(key)
    return true
  })

  await db.transaction(async (tx) => {
    for (const batch of toBatches(newRecords)) {
      await tx.orm.public.PunchRecord.createAndCount(batch)
    }
  })
}

const createManyExistentsInAfd = async (
  data: TPunchRecordCreateManyExistentsInAfdData
): Promise<void> => {
  const validData = await createManyExistentsInAfdSchema.parseAsync(data)
  await db.transaction(async (tx) => {
    for (const batch of toBatches(validData)) {
      await tx.orm.public.PunchRecord.createAndCount(batch, {
        onConflict: 'skip',
        conflictOn: ['nsr']
      })
    }
  })
}

const findMany = async (
  params: TPunchRecordFindManyParams = {}
): Promise<PunchRecord[]> => {
  const { initialDate, finalDate, initialNsr, finalNsr, pis } =
    await findManyParamsSchema.parseAsync(params)
  let query = punchRecords.where({})

  if (initialDate) {
    const date = new Date(initialDate)
    date.setUTCHours(0, 0, 0, 0)
    query = query.where((record) => record.datetime.gte(date))
  }

  if (finalDate) {
    const date = new Date(finalDate)
    date.setUTCHours(23, 59, 59, 999)
    query = query.where((record) => record.datetime.lte(date))
  }

  if (initialNsr) query = query.where((record) => record.nsr.gte(initialNsr))
  if (finalNsr) query = query.where((record) => record.nsr.lte(finalNsr))
  if (pis) query = query.where({ pis })

  return await query.all()
}

const update = async (data: TPunchRecordUpdateData): Promise<PunchRecord> => {
  const { id, ...validData } = await updateSchema.parseAsync(data)
  const punchRecord = await punchRecords.where({ id }).update(validData)
  if (!punchRecord) throw new Error(`PunchRecord ${id} not found`)
  return punchRecord
}

const updateMany = async (data: TPunchRecordUpdateData[]): Promise<void> => {
  await db.transaction(async (tx) => {
    for (const { id, datetime } of data) {
      const updated = await tx.orm.public.PunchRecord.where({ id }).update({
        datetime
      })
      if (!updated) throw new Error(`PunchRecord ${id} not found`)
    }
  })
}

const deleteRecord = async (id: string): Promise<PunchRecord> => {
  const punchRecord = await punchRecords.where({ id }).delete()
  if (!punchRecord) throw new Error(`PunchRecord ${id} not found`)
  return punchRecord
}

export const punchRecordModel = {
  createNonExistentInAfd,
  createManyNonExistentInAfd,
  createManyExistentsInAfd,
  findMany,
  update,
  updateMany,
  delete: deleteRecord
}
