import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { justifications } from '@/infra/database/schema'
import type {
  Justification,
  TInputData,
  TJustificationWithType
} from '@/infra/database/types'

export const justificationRepository = {
  findUniqueById: async (id: string): Promise<Justification | null> =>
    (await database.query.justifications.findFirst({ where: { id } })) ?? null,

  findManyInPeriod: async ({
    userId,
    initialDate,
    finalDate
  }: {
    userId: string
    initialDate: string
    finalDate: string
  }): Promise<TJustificationWithType[]> =>
    await database.query.justifications.findMany({
      where: {
        userId,
        startDate: { lte: finalDate },
        endDate: { gte: initialDate }
      },
      with: { type: true },
      orderBy: { startDate: 'asc' }
    }),

  findManyInPeriodByUserIds: async ({
    userIds,
    initialDate,
    finalDate
  }: {
    userIds: string[]
    initialDate: string
    finalDate: string
  }): Promise<TJustificationWithType[]> =>
    await database.query.justifications.findMany({
      where: {
        userId: { in: userIds },
        startDate: { lte: finalDate },
        endDate: { gte: initialDate }
      },
      with: { type: true },
      orderBy: { startDate: 'asc' }
    }),

  existsByTypeId: async (typeId: string): Promise<boolean> =>
    (await database.query.justifications.findFirst({
      where: { typeId },
      columns: { id: true }
    })) !== undefined,

  create: async (data: TInputData<Justification>): Promise<Justification> => {
    const [justification] = await database
      .insert(justifications)
      .values(data)
      .returning()
    return justification
  },

  update: async ({
    id,
    ...data
  }: TInputData<Justification> & {
    id: string
  }): Promise<Justification | null> => {
    const [justification = null] = await database
      .update(justifications)
      .set(data)
      .where(eq(justifications.id, id))
      .returning()
    return justification
  },

  remove: async (id: string): Promise<Justification | null> => {
    const [justification = null] = await database
      .delete(justifications)
      .where(eq(justifications.id, id))
      .returning()
    return justification
  }
}
