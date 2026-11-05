import type { PunchRecord } from '@/infra/database/types'
import { punchRecordRepo } from '@/repositories/punch-record-repo'

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
  return await punchRecordRepo.create(validData)
}

const createManyNonExistentInAfd = async (
  data: TPunchRecordCreateNonExistentInAfdData[]
): Promise<void> => {
  const validData = await createManyNonExistentsInAfdSchema.parseAsync(data)
  const pisList = [...new Set(validData.map(({ pis }) => pis))]
  const savedRecords = await punchRecordRepo.findManyByPisList(pisList)
  const seenRecords = new Set(savedRecords.map(getRecordKey))
  const newRecords = validData.filter((record) => {
    const key = getRecordKey(record)
    if (seenRecords.has(key)) return false
    seenRecords.add(key)
    return true
  })

  await punchRecordRepo.createMany(newRecords)
}

const createManyExistentsInAfd = async (
  data: TPunchRecordCreateManyExistentsInAfdData
): Promise<void> => {
  const validData = await createManyExistentsInAfdSchema.parseAsync(data)
  await punchRecordRepo.createManySkippingSavedNsrs(validData)
}

const findMany = async (
  params: TPunchRecordFindManyParams = {}
): Promise<PunchRecord[]> => {
  const { initialDate, finalDate, initialNsr, finalNsr, pis } =
    await findManyParamsSchema.parseAsync(params)

  const startOfInitialDay = initialDate ? new Date(initialDate) : undefined
  startOfInitialDay?.setUTCHours(0, 0, 0, 0)
  const endOfFinalDay = finalDate ? new Date(finalDate) : undefined
  endOfFinalDay?.setUTCHours(23, 59, 59, 999)

  return await punchRecordRepo.findMany({
    initialDate: startOfInitialDay,
    finalDate: endOfFinalDay,
    initialNsr,
    finalNsr,
    pis
  })
}

const update = async (data: TPunchRecordUpdateData): Promise<PunchRecord> => {
  const { id, ...validData } = await updateSchema.parseAsync(data)
  const punchRecord = await punchRecordRepo.update(id, validData)
  if (!punchRecord) throw new Error(`PunchRecord ${id} not found`)
  return punchRecord
}

const updateMany = async (data: TPunchRecordUpdateData[]): Promise<void> => {
  await punchRecordRepo.updateMany(data)
}

const deleteRecord = async (id: string): Promise<PunchRecord> => {
  const punchRecord = await punchRecordRepo.delete(id)
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
