import { sql } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import { justificationCodeMappings } from '@/infra/database/schema'
import type {
  JustificationCodeMapping,
  TInputData
} from '@/infra/database/types'

export const justificationCodeMappingRepository = {
  findManyByFormat: async ({
    companyId,
    format
  }: Pick<JustificationCodeMapping, 'companyId' | 'format'>): Promise<
    JustificationCodeMapping[]
  > =>
    await database.query.justificationCodeMappings.findMany({
      where: { companyId, format }
    }),

  saveMany: async (
    mappings: TInputData<JustificationCodeMapping>[],
    transaction?: TTransaction
  ): Promise<void> => {
    if (mappings.length === 0) return
    await runInTransaction(transaction, async (tx) => {
      await tx
        .insert(justificationCodeMappings)
        .values(mappings)
        .onConflictDoUpdate({
          target: [
            justificationCodeMappings.companyId,
            justificationCodeMappings.format,
            justificationCodeMappings.code
          ],
          set: {
            typeId: sql`excluded.type_id`,
            updatedAt: new Date()
          }
        })
    })
  }
}
