import { and, eq, gte, inArray, lte } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import {
  restRuleConstraints,
  restRules,
  restRuleShiftPatterns,
  shiftAdjustments
} from '@/infra/database/schema'
import type {
  RestRule,
  RestRuleConstraint,
  ShiftAdjustment,
  TInputData,
  TRestRuleWithRelations
} from '@/infra/database/types'

type TRestRuleData = TInputData<RestRule> & {
  shiftPatternIds: string[]
  constraints: Pick<RestRuleConstraint, 'constraint' | 'level' | 'position'>[]
}

type TRuleAdjustment = Pick<
  ShiftAdjustment,
  'userId' | 'date' | 'kind' | 'shiftAssignmentId'
>

const withRelations = {
  shiftPatterns: true,
  constraints: { orderBy: { constraint: 'asc' } }
} as const

export const restRuleRepository = {
  findManyByCompanyId: async (
    companyId: string
  ): Promise<TRestRuleWithRelations[]> =>
    await database.query.restRules.findMany({
      where: { companyId },
      with: withRelations,
      orderBy: { name: 'asc' }
    }),

  findUnique: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<TRestRuleWithRelations | null> =>
    (await database.query.restRules.findFirst({
      where: { id, companyId },
      with: withRelations
    })) ?? null,

  save: async ({
    id,
    shiftPatternIds,
    constraints,
    ...data
  }: TRestRuleData & { id?: string }): Promise<RestRule> =>
    await database.transaction(async (tx) => {
      const [rule] = id
        ? await tx
            .update(restRules)
            .set(data)
            .where(eq(restRules.id, id))
            .returning()
        : await tx.insert(restRules).values(data).returning()
      await tx
        .delete(restRuleShiftPatterns)
        .where(eq(restRuleShiftPatterns.restRuleId, rule.id))
      await tx
        .delete(restRuleConstraints)
        .where(eq(restRuleConstraints.restRuleId, rule.id))
      await tx.insert(restRuleShiftPatterns).values(
        shiftPatternIds.map((shiftPatternId) => ({
          restRuleId: rule.id,
          shiftPatternId
        }))
      )
      if (constraints.length > 0) {
        await tx.insert(restRuleConstraints).values(
          constraints.map((constraint) => ({
            ...constraint,
            restRuleId: rule.id
          }))
        )
      }
      return rule
    }),

  remove: async (id: string): Promise<void> => {
    await database.delete(restRules).where(eq(restRules.id, id))
  },

  // Generating again replaces only what a rule generated, so the manual adjustments keep their days
  replaceRuleAdjustments: async ({
    userIds,
    initialDate,
    finalDate,
    adjustments
  }: {
    userIds: string[]
    initialDate: string
    finalDate: string
    adjustments: TRuleAdjustment[]
  }): Promise<number> =>
    await database.transaction(async (tx) => {
      if (userIds.length > 0) {
        await tx
          .delete(shiftAdjustments)
          .where(
            and(
              inArray(shiftAdjustments.userId, userIds),
              eq(shiftAdjustments.origin, 'rule'),
              gte(shiftAdjustments.date, initialDate),
              lte(shiftAdjustments.date, finalDate)
            )
          )
      }
      if (adjustments.length === 0) return 0
      const saved = await tx
        .insert(shiftAdjustments)
        .values(
          adjustments.map((adjustment) => ({
            ...adjustment,
            origin: 'rule',
            entry1: null,
            exit1: null,
            entry2: null,
            exit2: null,
            entry3: null,
            exit3: null
          }))
        )
        .onConflictDoNothing({
          target: [shiftAdjustments.userId, shiftAdjustments.date]
        })
        .returning({ id: shiftAdjustments.id })
      return saved.length
    })
}
