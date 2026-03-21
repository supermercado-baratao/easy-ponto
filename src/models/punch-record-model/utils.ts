import { Prisma } from '@prisma/client'

import { TPunchRecordFindManyParams } from './types'

export const buildFindManyWhere = (
  params?: TPunchRecordFindManyParams
): Prisma.PunchRecordWhereInput => {
  const where: Prisma.PunchRecordWhereInput = {}

  if (params?.companyId) {
    where.user = {
      companyId: params.companyId
    }
  }

  if (params?.initialDate) {
    const date = new Date(params.initialDate)
    date.setUTCHours(0, 0, 0, 0)
    where.datetime = { gte: date }
  }

  if (params?.finalDate) {
    const date = new Date(params.finalDate)
    date.setUTCHours(23, 59, 59, 999)
    where.datetime = {
      ...(where.datetime as object),
      lte: date
    }
  }

  if (params?.initialNsr) {
    where.nsr = { gte: params.initialNsr }
  }

  if (params?.finalNsr) {
    where.nsr = { ...(where.nsr as object), lte: params.finalNsr }
  }

  if (params?.pis) {
    where.pis = params.pis
  }

  return where
}
