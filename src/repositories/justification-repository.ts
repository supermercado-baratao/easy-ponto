import { database } from '@/infra/database/client'
import type {
  Justification,
  TInputData,
  TJustificationWithType
} from '@/infra/database/types'

const justifications = database.orm.public.Justification

export const justificationRepository = {
  findUniqueById: async (id: string): Promise<Justification | null> =>
    await justifications.first({ id }),

  findManyInPeriod: async ({
    userId,
    initialDate,
    finalDate
  }: {
    userId: string
    initialDate: string
    finalDate: string
  }): Promise<TJustificationWithType[]> =>
    await justifications
      .where({ userId })
      .where((justification) => justification.startDate.lte(finalDate))
      .where((justification) => justification.endDate.gte(initialDate))
      .include('type')
      .orderBy((justification) => justification.startDate.asc())
      .all(),

  existsByTypeId: async (typeId: string): Promise<boolean> =>
    (await justifications.first({ typeId })) !== null,

  create: async (data: TInputData<Justification>): Promise<Justification> =>
    await justifications.create(data),

  update: async ({
    id,
    ...data
  }: TInputData<Justification> & {
    id: string
  }): Promise<Justification | null> =>
    await justifications.where({ id }).update(data),

  remove: async (id: string): Promise<Justification | null> =>
    await justifications.where({ id }).delete()
}
