import { and, eq, type SQL } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { justificationTypes } from '@/infra/database/schema'
import type { JustificationType, TInputData } from '@/infra/database/types'

type TCompanyScopedId = { id: string; companyId: string }

const whereCompanyScopedId = ({
  id,
  companyId
}: TCompanyScopedId): SQL | undefined =>
  and(
    eq(justificationTypes.id, id),
    eq(justificationTypes.companyId, companyId)
  )

export const justificationTypeRepository = {
  findManyByCompanyId: async (
    companyId: string
  ): Promise<JustificationType[]> =>
    await database.query.justificationTypes.findMany({
      where: { companyId },
      orderBy: { code: 'asc' }
    }),

  findUnique: async ({
    id,
    companyId
  }: TCompanyScopedId): Promise<JustificationType | null> =>
    (await database.query.justificationTypes.findFirst({
      where: { id, companyId }
    })) ?? null,

  create: async (
    data: TInputData<JustificationType>
  ): Promise<JustificationType> => {
    const [type] = await database
      .insert(justificationTypes)
      .values(data)
      .returning()
    return type
  },

  update: async ({
    id,
    companyId,
    ...data
  }: TInputData<JustificationType> & {
    id: string
  }): Promise<JustificationType | null> => {
    const [type = null] = await database
      .update(justificationTypes)
      .set(data)
      .where(whereCompanyScopedId({ id, companyId }))
      .returning()
    return type
  },

  remove: async (
    scopedId: TCompanyScopedId
  ): Promise<JustificationType | null> => {
    const [type = null] = await database
      .delete(justificationTypes)
      .where(whereCompanyScopedId(scopedId))
      .returning()
    return type
  }
}
