import { PunchRecord } from '@prisma/client'

import { prisma } from '@/infra/prisma'

import {
  TPunchRecordCreateData,
  TPunchRecordCreateManyData,
  TPunchRecordFindManyParams,
  TPunchRecordUpdateData
} from './types'
import { buildFindManyWhere } from './utils'

const create = async (data: TPunchRecordCreateData): Promise<PunchRecord> => {
  const result = await prisma.punchRecord.create({ data })
  return result
}

const createMany = async (data: TPunchRecordCreateManyData): Promise<void> => {
  await prisma.punchRecord.createMany({
    data
  })
}

const findMany = async (
  params?: TPunchRecordFindManyParams
): Promise<PunchRecord[]> => {
  const where = buildFindManyWhere(params)
  const punchRecords = await prisma.punchRecord.findMany({
    where
  })
  return punchRecords
}

const update = async (
  data: TPunchRecordUpdateData,
  id: string
): Promise<PunchRecord> => {
  const punchRecord = await prisma.punchRecord.update({
    where: { id },
    data
  })
  return punchRecord
}

const deleteRecord = async (id: string): Promise<PunchRecord> => {
  const punchRecord = await prisma.punchRecord.delete({
    where: { id }
  })
  return punchRecord
}

export const punchRecordModel = {
  create,
  createMany,
  findMany,
  update,
  delete: deleteRecord
}
