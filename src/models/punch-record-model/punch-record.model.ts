import { PunchRecord } from '@prisma/client'

import { prisma } from '@/infra/prisma'

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
import { buildFindManyWhere } from './utils'

const createNonExistentInAfd = async (
  data: TPunchRecordCreateNonExistentInAfdData
): Promise<PunchRecord> => {
  const validData = await createNonExistentInAfdSchema.parseAsync(data)
  const result = await prisma.punchRecord.create({ data: validData })
  return result
}

const createManyNonExistentInAfd = async (
  data: TPunchRecordCreateNonExistentInAfdData[]
): Promise<void> => {
  const validData = await createManyNonExistentsInAfdSchema.parseAsync(data)
  await prisma.punchRecord.createMany({
    data: validData
  })
}

const createManyExistentsInAfd = async (
  data: TPunchRecordCreateManyExistentsInAfdData
): Promise<void> => {
  const validData = await createManyExistentsInAfdSchema.parseAsync(data)
  await prisma.punchRecord.createMany({
    data: validData
  })
}

const findMany = async (
  params?: TPunchRecordFindManyParams
): Promise<PunchRecord[]> => {
  const validParams = await findManyParamsSchema.parseAsync(params)
  const where = buildFindManyWhere(validParams)
  const punchRecords = await prisma.punchRecord.findMany({
    where
  })
  return punchRecords
}

const update = async (data: TPunchRecordUpdateData): Promise<PunchRecord> => {
  const validData = await updateSchema.parseAsync(data)
  const punchRecord = await prisma.punchRecord.update({
    where: { id: validData.id },
    data: validData
  })
  return punchRecord
}

const updateMany = async (data: TPunchRecordUpdateData[]): Promise<void> => {
  await prisma.$transaction(
    data.map(({ id, datetime }) =>
      prisma.punchRecord.update({
        where: { id },
        data: { datetime }
      })
    )
  )
}

const deleteRecord = async (id: string): Promise<PunchRecord> => {
  const punchRecord = await prisma.punchRecord.delete({
    where: { id }
  })
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
