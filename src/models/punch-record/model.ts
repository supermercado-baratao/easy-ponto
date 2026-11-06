import type { PunchRecord } from '@/infra/database/types'
import { punchRecordRepository } from '@/repositories/punch-record-repository'

import {
  createManyExistentsInAfdSchema,
  createManyNonExistentsInAfdSchema,
  createNonExistentInAfdSchema,
  findManyByDayParamsSchema,
  findManyParamsSchema,
  updateSchema
} from './schema'
import {
  TPunchRecordCreateManyExistentsInAfdData,
  TPunchRecordCreateNonExistentInAfdData,
  TPunchRecordDay,
  TPunchRecordFindManyByDayParams,
  TPunchRecordFindManyParams,
  TPunchRecordUpdateData
} from './types'
import { groupByDay, resolvePeriod } from './utils'

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
  return await punchRecordRepository.create(validData)
}

const createManyNonExistentInAfd = async (
  data: TPunchRecordCreateNonExistentInAfdData[]
): Promise<void> => {
  const validData = await createManyNonExistentsInAfdSchema.parseAsync(data)
  const pisList = [...new Set(validData.map(({ pis }) => pis))]
  const savedRecords = await punchRecordRepository.findManyByPisList(pisList)
  const seenRecords = new Set(
    savedRecords.map((record) => getRecordKey(record))
  )
  const newRecords = validData.filter((record) => {
    const key = getRecordKey(record)
    if (seenRecords.has(key)) return false
    seenRecords.add(key)
    return true
  })

  await punchRecordRepository.createMany(newRecords)
}

const createManyExistentsInAfd = async (
  data: TPunchRecordCreateManyExistentsInAfdData
): Promise<void> => {
  const validData = await createManyExistentsInAfdSchema.parseAsync(data)
  await punchRecordRepository.createManySkippingSavedNsrs(validData)
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

  return await punchRecordRepository.findMany({
    initialDate: startOfInitialDay,
    finalDate: endOfFinalDay,
    initialNsr,
    finalNsr,
    pis
  })
}

const findManyByDay = async (
  params: TPunchRecordFindManyByDayParams
): Promise<TPunchRecordDay[]> => {
  const { pis, ...period } = await findManyByDayParamsSchema.parseAsync(params)
  const punchRecords = await findMany({ pis, ...period })
  return groupByDay(punchRecords, period)
}

const update = async (data: TPunchRecordUpdateData): Promise<PunchRecord> => {
  const { id, ...validData } = await updateSchema.parseAsync(data)
  const punchRecord = await punchRecordRepository.update(id, validData)
  if (!punchRecord) throw new Error(`PunchRecord ${id} not found`)
  return punchRecord
}

const updateMany = async (data: TPunchRecordUpdateData[]): Promise<void> => {
  await punchRecordRepository.updateMany(data)
}

const deleteRecord = async (id: string): Promise<PunchRecord> => {
  const punchRecord = await punchRecordRepository.delete(id)
  if (!punchRecord) throw new Error(`PunchRecord ${id} not found`)
  return punchRecord
}

export const punchRecordModel = {
  createNonExistentInAfd,
  createManyNonExistentInAfd,
  createManyExistentsInAfd,
  findMany,
  findManyByDay,
  resolvePeriod,
  update,
  updateMany,
  delete: deleteRecord
}
