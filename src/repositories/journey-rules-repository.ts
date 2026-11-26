import { eq } from 'drizzle-orm'

import { database } from '@/infra/database/client'
import { journeyRules, overtimeBands } from '@/infra/database/schema'
import type {
  JourneyRules,
  OvertimeBand,
  TInputData
} from '@/infra/database/types'

export const journeyRulesRepository = {
  findByCompanyId: async (companyId: string): Promise<JourneyRules | null> =>
    (await database.query.journeyRules.findFirst({ where: { companyId } })) ??
    null,

  findOvertimeBandsByCompanyId: async (
    companyId: string
  ): Promise<OvertimeBand[]> =>
    await database.query.overtimeBands.findMany({
      where: { companyId },
      // Postgres puts the nulls last in an ascending order, so the band of the remaining hours ends its kind
      orderBy: { dayKind: 'asc', upTo: 'asc' }
    }),

  save: async (data: TInputData<JourneyRules>): Promise<JourneyRules> => {
    const [saved] = await database
      .insert(journeyRules)
      .values(data)
      .onConflictDoUpdate({
        target: journeyRules.companyId,
        set: {
          punchTolerance: data.punchTolerance,
          dailyTolerance: data.dailyTolerance,
          maxLunch: data.maxLunch,
          maxDailyJourney: data.maxDailyJourney,
          maxContinuousWork: data.maxContinuousWork,
          updatedAt: new Date()
        }
      })
      .returning()
    return saved
  },

  replaceOvertimeBands: async ({
    companyId,
    overtimeBands: bands
  }: {
    companyId: string
    overtimeBands: Omit<TInputData<OvertimeBand>, 'companyId'>[]
  }): Promise<OvertimeBand[]> =>
    await database.transaction(async (tx) => {
      await tx
        .delete(overtimeBands)
        .where(eq(overtimeBands.companyId, companyId))
      return await tx
        .insert(overtimeBands)
        .values(bands.map((band) => ({ ...band, companyId })))
        .returning()
    })
}
