import { database } from '@/infra/database/client'
import type { Holiday, TInputData } from '@/infra/database/types'

const holidays = database.orm.public.Holiday

export const holidayRepository = {
  findManyByCompanyId: async (companyId: string): Promise<Holiday[]> =>
    await holidays.where({ companyId }).all(),

  create: async (data: TInputData<Holiday>): Promise<Holiday> =>
    await holidays.create(data),

  createMany: async (data: TInputData<Holiday>[]): Promise<number> =>
    await holidays.createAndCount(data),

  update: async ({
    id,
    companyId,
    ...data
  }: TInputData<Holiday> & { id: string }): Promise<Holiday | null> =>
    await holidays.where({ id, companyId }).update(data),

  remove: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<Holiday | null> =>
    await holidays.where({ id, companyId }).delete()
}
