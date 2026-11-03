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
  await punchRecords.createAndCount(validData)
}

const createManyExistentsInAfd = async (
  data: TPunchRecordCreateManyExistentsInAfdData
): Promise<void> => {
  const validData = await createManyExistentsInAfdSchema.parseAsync(data)
  await punchRecords.createAndCount(validData)
}

const findMany = async (
  params?: TPunchRecordFindManyParams
): Promise<PunchRecord[]> => {
  const validParams = await findManyParamsSchema.parseAsync(params)
  let query = punchRecords.where({})

  if (validParams?.initialDate) {
    const date = new Date(validParams.initialDate)
    date.setUTCHours(0, 0, 0, 0)
    query = query.where((record) => record.datetime.gte(date))
  }

  if (validParams?.finalDate) {
    const date = new Date(validParams.finalDate)
    date.setUTCHours(23, 59, 59, 999)
    query = query.where((record) => record.datetime.lte(date))
  }

  const { initialNsr, finalNsr, pis } = validParams ?? {}

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
