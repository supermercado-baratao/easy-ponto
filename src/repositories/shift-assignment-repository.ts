import { and, countDistinct, eq, inArray } from 'drizzle-orm'

import {
  database,
  runInTransaction,
  type TTransaction
} from '@/infra/database/client'
import {
  shiftAdjustments,
  shiftAssignments,
  users
} from '@/infra/database/schema'
import type {
  ShiftAdjustment,
  ShiftAssignment,
  TInputData,
  TShiftAssignmentWithPattern
} from '@/infra/database/types'

type TAssignmentUpdateData = Pick<
  ShiftAssignment,
  'id' | 'shiftPatternId' | 'startDate' | 'endDate' | 'cycleStartDay'
>

const withShiftPattern = {
  shiftPattern: {
    with: {
      versions: {
        orderBy: { startDate: 'desc' },
        with: { days: { orderBy: { cycleDay: 'asc' } } }
      }
    }
  }
} as const

const isUserInCompany = async ({
  userId,
  companyId
}: {
  userId: string
  companyId: string
}): Promise<boolean> =>
  !!(await database.query.users.findFirst({
    where: { id: userId, companyId },
    columns: { id: true }
  }))

const findManyByUserIds = async (
  userIds: string[],
  tx: TTransaction | typeof database = database
): Promise<TShiftAssignmentWithPattern[]> =>
  userIds.length === 0
    ? []
    : await tx.query.shiftAssignments.findMany({
        where: { userId: { in: userIds } },
        with: withShiftPattern,
        orderBy: { startDate: 'desc' }
      })

export const shiftAssignmentRepository = {
  isUserInCompany,

  findManyByUserIds: async (
    userIds: string[]
  ): Promise<TShiftAssignmentWithPattern[]> => await findManyByUserIds(userIds),

  findUnique: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<ShiftAssignment | null> => {
    const [assignment = null] = await database
      .select({ assignment: shiftAssignments })
      .from(shiftAssignments)
      .innerJoin(users, eq(users.id, shiftAssignments.userId))
      .where(and(eq(shiftAssignments.id, id), eq(users.companyId, companyId)))
    return assignment?.assignment ?? null
  },

  countUsersByShiftPatternId: async (
    shiftPatternId: string
  ): Promise<number> => {
    const [{ count }] = await database
      .select({ count: countDistinct(shiftAssignments.userId) })
      .from(shiftAssignments)
      .where(eq(shiftAssignments.shiftPatternId, shiftPatternId))
    return count
  },

  create: async (
    data: TInputData<ShiftAssignment>,
    tx: TTransaction | typeof database = database
  ): Promise<ShiftAssignment> => {
    const [assignment] = await tx
      .insert(shiftAssignments)
      .values(data)
      .returning()
    return assignment
  },

  update: async ({
    id,
    ...data
  }: TAssignmentUpdateData): Promise<ShiftAssignment> => {
    const [assignment] = await database
      .update(shiftAssignments)
      .set(data)
      .where(eq(shiftAssignments.id, id))
      .returning()
    return assignment
  },

  remove: async (id: string): Promise<void> => {
    await database.delete(shiftAssignments).where(eq(shiftAssignments.id, id))
  },

  // The imported schedule replaces the links from the first day of the report on
  replaceFrom: async (
    {
      userId,
      startDate,
      endDate
    }: { userId: string; startDate: string; endDate: string },
    transaction?: TTransaction
  ): Promise<void> =>
    await runInTransaction(transaction, async (tx) => {
      const assignments = await findManyByUserIds([userId], tx)
      const removedIds = assignments
        .filter((assignment) => assignment.startDate >= startDate)
        .map(({ id }) => id)
      if (removedIds.length > 0) {
        await tx
          .delete(shiftAssignments)
          .where(inArray(shiftAssignments.id, removedIds))
      }
      const endedIds = assignments
        .filter(
          (assignment) =>
            assignment.startDate < startDate &&
            (assignment.endDate === null || assignment.endDate > endDate)
        )
        .map(({ id }) => id)
      if (endedIds.length > 0) {
        await tx
          .update(shiftAssignments)
          .set({ endDate })
          .where(inArray(shiftAssignments.id, endedIds))
      }
    }),

  findAdjustmentsByUserId: async ({
    userId,
    initialDate,
    finalDate
  }: {
    userId: string
    initialDate?: string
    finalDate?: string
  }): Promise<ShiftAdjustment[]> =>
    await database.query.shiftAdjustments.findMany({
      where: {
        userId,
        ...(initialDate &&
          finalDate && { date: { gte: initialDate, lte: finalDate } })
      },
      orderBy: { date: 'asc' }
    }),

  findAdjustmentsByUserIds: async ({
    userIds,
    initialDate,
    finalDate
  }: {
    userIds: string[]
    initialDate: string
    finalDate: string
  }): Promise<ShiftAdjustment[]> =>
    userIds.length === 0
      ? []
      : await database.query.shiftAdjustments.findMany({
          where: {
            userId: { in: userIds },
            date: { gte: initialDate, lte: finalDate }
          },
          orderBy: { date: 'asc' }
        }),

  findAdjustment: async ({
    id,
    companyId
  }: {
    id: string
    companyId: string
  }): Promise<ShiftAdjustment | null> => {
    const [adjustment = null] = await database
      .select({ adjustment: shiftAdjustments })
      .from(shiftAdjustments)
      .innerJoin(users, eq(users.id, shiftAdjustments.userId))
      .where(and(eq(shiftAdjustments.id, id), eq(users.companyId, companyId)))
    return adjustment?.adjustment ?? null
  },

  saveAdjustment: async (
    data: TInputData<ShiftAdjustment>
  ): Promise<ShiftAdjustment> => {
    const {
      kind,
      shiftAssignmentId,
      origin,
      entry1,
      exit1,
      entry2,
      exit2,
      entry3,
      exit3
    } = data
    const [adjustment] = await database
      .insert(shiftAdjustments)
      .values(data)
      .onConflictDoUpdate({
        target: [shiftAdjustments.userId, shiftAdjustments.date],
        set: {
          kind,
          shiftAssignmentId,
          origin,
          entry1,
          exit1,
          entry2,
          exit2,
          entry3,
          exit3
        }
      })
      .returning()
    return adjustment
  },

  removeAdjustment: async (id: string): Promise<void> => {
    await database.delete(shiftAdjustments).where(eq(shiftAdjustments.id, id))
  }
}
