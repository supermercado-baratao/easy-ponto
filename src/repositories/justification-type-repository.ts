import { database } from '@/infra/database/client'
import type { JustificationType, TInputData } from '@/infra/database/types'

type TCompanyScopedId = { id: string; companyId: string }

const justificationTypes = database.orm.public.JustificationType

export const justificationTypeRepository = {
  findManyByCompanyId: async (
    companyId: string
  ): Promise<JustificationType[]> =>
    await justificationTypes
      .where({ companyId })
      .orderBy((type) => type.code.asc())
      .all(),

  findUnique: async ({
    id,
    companyId
  }: TCompanyScopedId): Promise<JustificationType | null> =>
    await justificationTypes.first({ id, companyId }),

  create: async (
    data: TInputData<JustificationType>
  ): Promise<JustificationType> => await justificationTypes.create(data),

  update: async ({
    id,
    companyId,
    ...data
  }: TInputData<JustificationType> & {
    id: string
  }): Promise<JustificationType | null> =>
    await justificationTypes.where({ id, companyId }).update(data),

  remove: async ({
    id,
    companyId
  }: TCompanyScopedId): Promise<JustificationType | null> =>
    await justificationTypes.where({ id, companyId }).delete()
}
