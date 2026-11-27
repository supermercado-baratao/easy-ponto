import { and, count, eq, type SQL } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { jobFunctions, userJobFunctions } from '@/infra/database/schema'
import type {
  JobFunction,
  TInputData,
  UserJobFunction
} from '@/infra/database/types'

type TCompanyScopedId = { id: string; companyId: string }

const whereCompanyScopedId = ({
  id,
  companyId
}: TCompanyScopedId): SQL | undefined =>
  and(eq(jobFunctions.id, id), eq(jobFunctions.companyId, companyId))

export const jobFunctionRepository = {
  findManyByCompanyId: async (companyId: string): Promise<JobFunction[]> =>
    await database.query.jobFunctions.findMany({
      where: { companyId },
      orderBy: { level: 'desc', name: 'asc' }
    }),

  findUnique: async ({
    id,
    companyId
  }: TCompanyScopedId): Promise<JobFunction | null> =>
    (await database.query.jobFunctions.findFirst({
      where: { id, companyId }
    })) ?? null,

  findUserFunctionsByCompanyId: async (
    companyId: string
  ): Promise<Pick<UserJobFunction, 'userId' | 'jobFunctionId' | 'active'>[]> =>
    await database
      .select({
        userId: userJobFunctions.userId,
        jobFunctionId: userJobFunctions.jobFunctionId,
        active: userJobFunctions.active
      })
      .from(userJobFunctions)
      .innerJoin(
        jobFunctions,
        eq(userJobFunctions.jobFunctionId, jobFunctions.id)
      )
      .where(eq(jobFunctions.companyId, companyId)),

  countUsers: async (jobFunctionId: string): Promise<number> => {
    const [{ total }] = await database
      .select({ total: count() })
      .from(userJobFunctions)
      .where(eq(userJobFunctions.jobFunctionId, jobFunctionId))
    return total
  },

  create: async (data: TInputData<JobFunction>): Promise<JobFunction> => {
    const [jobFunction] = await database
      .insert(jobFunctions)
      .values(data)
      .returning()
    return jobFunction
  },

  createMany: async (
    data: TInputData<JobFunction>[]
  ): Promise<JobFunction[]> =>
    data.length === 0
      ? []
      : await database.insert(jobFunctions).values(data).returning(),

  update: async ({
    id,
    companyId,
    ...data
  }: TInputData<JobFunction> & { id: string }): Promise<JobFunction | null> => {
    const [jobFunction = null] = await database
      .update(jobFunctions)
      .set(data)
      .where(whereCompanyScopedId({ id, companyId }))
      .returning()
    return jobFunction
  },

  remove: async (scopedId: TCompanyScopedId): Promise<JobFunction | null> => {
    const [jobFunction = null] = await database
      .delete(jobFunctions)
      .where(whereCompanyScopedId(scopedId))
      .returning()
    return jobFunction
  },

  replaceUserFunctions: async (
    {
      userId,
      links
    }: {
      userId: string
      links: Pick<UserJobFunction, 'jobFunctionId' | 'active'>[]
    },
    transaction?: TTransaction
  ): Promise<void> => {
    await runInTransaction(transaction, async (tx) => {
      await tx
        .delete(userJobFunctions)
        .where(eq(userJobFunctions.userId, userId))
      if (links.length === 0) return
      await tx
        .insert(userJobFunctions)
        .values(links.map((link) => ({ ...link, userId })))
    })
  }
}
