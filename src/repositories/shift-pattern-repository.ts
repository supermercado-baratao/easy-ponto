import { and, eq } from 'drizzle-orm'

import { database, type TTransaction } from '@/infra/database/client'
import {
  shiftPatterns,
  shiftPatternVersionDays,
  shiftPatternVersions
} from '@/infra/database/schema'
import type {
  ShiftPattern,
  ShiftPatternVersionDay,
  TInputData,
  TShiftPatternWithVersions
} from '@/infra/database/types'

type TCompanyScopedId = { id: string; companyId: string }

type TVersionData = {
  id?: string
  startDate: string
  cycleLength: number
  days: Omit<TInputData<ShiftPatternVersionDay>, 'versionId'>[]
}

const withVersions = {
  versions: {
    orderBy: { startDate: 'desc' },
    with: { days: { orderBy: { cycleDay: 'asc' } } }
  }
} as const

const findUnique = async (
  { id, companyId }: TCompanyScopedId,
  tx: TTransaction | typeof database = database
): Promise<TShiftPatternWithVersions | null> =>
  (await tx.query.shiftPatterns.findFirst({
    where: { id, companyId },
    with: withVersions
  })) ?? null

const saveVersion = async (
  tx: TTransaction,
  shiftPatternId: string,
  { id, startDate, cycleLength, days }: TVersionData
): Promise<void> => {
  const [{ id: versionId }] = id
    ? await tx
        .update(shiftPatternVersions)
        .set({ startDate, cycleLength })
        .where(
          and(
            eq(shiftPatternVersions.id, id),
            eq(shiftPatternVersions.shiftPatternId, shiftPatternId)
          )
        )
        .returning({ id: shiftPatternVersions.id })
    : await tx
        .insert(shiftPatternVersions)
        .values({ startDate, cycleLength, shiftPatternId })
        .returning({ id: shiftPatternVersions.id })

  await tx
    .delete(shiftPatternVersionDays)
    .where(eq(shiftPatternVersionDays.versionId, versionId))
  await tx
    .insert(shiftPatternVersionDays)
    .values(days.map((day) => ({ ...day, versionId })))
}

const getSaved = async (
  tx: TTransaction,
  scopedId: TCompanyScopedId
): Promise<TShiftPatternWithVersions> => {
  const shiftPattern = await findUnique(scopedId, tx)
  if (!shiftPattern) throw new Error(`ShiftPattern ${scopedId.id} not found`)
  return shiftPattern
}

export const shiftPatternRepository = {
  findManyByCompanyId: async (
    companyId: string
  ): Promise<TShiftPatternWithVersions[]> =>
    await database.query.shiftPatterns.findMany({
      where: { companyId },
      with: withVersions,
      orderBy: { name: 'asc' }
    }),

  findUnique: async (
    scopedId: TCompanyScopedId
  ): Promise<TShiftPatternWithVersions | null> => await findUnique(scopedId),

  findUniqueByVersionId: async ({
    versionId,
    companyId
  }: {
    versionId: string
    companyId: string
  }): Promise<TShiftPatternWithVersions | null> => {
    const version = await database.query.shiftPatternVersions.findFirst({
      where: { id: versionId },
      columns: { shiftPatternId: true }
    })
    return version
      ? await findUnique({ id: version.shiftPatternId, companyId })
      : null
  },

  create: async ({
    companyId,
    name,
    version
  }: TInputData<ShiftPattern> & {
    version: TVersionData
  }): Promise<TShiftPatternWithVersions> =>
    await database.transaction(async (tx) => {
      const [{ id }] = await tx
        .insert(shiftPatterns)
        .values({ companyId, name })
        .returning({ id: shiftPatterns.id })
      await saveVersion(tx, id, version)
      return await getSaved(tx, { id, companyId })
    }),

  update: async ({
    id,
    companyId,
    name,
    version
  }: TInputData<ShiftPattern> & {
    id: string
    version: TVersionData
  }): Promise<TShiftPatternWithVersions> =>
    await database.transaction(async (tx) => {
      await tx
        .update(shiftPatterns)
        .set({ name })
        .where(
          and(eq(shiftPatterns.id, id), eq(shiftPatterns.companyId, companyId))
        )
      await saveVersion(tx, id, version)
      return await getSaved(tx, { id, companyId })
    }),

  removeVersion: async (id: string): Promise<void> => {
    await database
      .delete(shiftPatternVersions)
      .where(eq(shiftPatternVersions.id, id))
  },

  remove: async ({
    id,
    companyId
  }: TCompanyScopedId): Promise<ShiftPattern | null> => {
    const [shiftPattern = null] = await database
      .delete(shiftPatterns)
      .where(
        and(eq(shiftPatterns.id, id), eq(shiftPatterns.companyId, companyId))
      )
      .returning()
    return shiftPattern
  }
}
