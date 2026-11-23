import { sql } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import {
  justificationCodeMappings,
  justificationTypes as justificationTypesTable
} from '@/infra/database/schema'
import type {
  JustificationCodeMapping,
  JustificationType,
  TInputData
} from '@/infra/database/types'

export type TCodeResolutionsSaveData = {
  justificationTypes: (TInputData<JustificationType> & { id: string })[]
  mappings: TInputData<JustificationCodeMapping>[]
}

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

  saveResolutions: async (
    { justificationTypes, mappings }: TCodeResolutionsSaveData,
    transaction?: TTransaction
  ): Promise<void> => {
    await runInTransaction(transaction, async (tx) => {
      if (justificationTypes.length > 0) {
        await tx.insert(justificationTypesTable).values(justificationTypes)
      }
      if (mappings.length === 0) return
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
