import { z } from 'zod'

import type {
  ShiftAdjustment,
  ShiftAssignment,
  TShiftAssignmentWithPattern
} from '@/infra/database/types'
import { NotFoundError } from '@/infra/errors'
import { ShiftPatternNotFoundError } from '@/models/shift-pattern/errors'
import { selectVersionInEffect } from '@/models/shift-pattern/utils'
import { shiftAssignmentRepository } from '@/repositories/shift-assignment-repository'
import { shiftPatternRepository } from '@/repositories/shift-pattern-repository'

import {
  ShiftAdjustmentNotFoundError,
  ShiftAssignmentNotFoundError,
  ShiftConflictError
} from './errors'
import {
  createSchema,
  findManyByUserIdParamsSchema,
  findUserDaysParamsSchema,
  removeAdjustmentSchema,
  removeSchema,
  saveAdjustmentSchema,
  updateSchema
} from './schema'
import type {
  TShiftAdjustmentRemoveParams,
  TShiftAdjustmentSaveData,
  TShiftAssignmentCreateData,
  TShiftAssignmentFindManyByUserIdParams,
  TShiftAssignmentFindUserDaysParams,
  TShiftAssignmentRemoveParams,
  TShiftAssignmentUpdateData
} from './types'
import {
  findShiftConflict,
  isInEffect,
  resolveDays,
  type TResolvedDay
} from './utils'

const throwFieldError = (
  path: string,
  message: string,
  input: string | number
): never => {
  throw new z.ZodError([{ code: 'custom', path: [path], message, input }])
}

const assertUserInCompany = async (params: {
  userId: string
  companyId: string
}): Promise<void> => {
  if (!(await shiftAssignmentRepository.isUserInCompany(params))) {
    throw new NotFoundError({
      message: 'O funcionário não foi encontrado.',
      cause: `User ${params.userId} not found in company ${params.companyId}`
    })
  }
}

const validateAssignment = async ({
  id,
  companyId,
  userId,
  shiftPatternId,
  startDate,
  endDate,
  cycleStartDay
}: Omit<ShiftAssignment, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
  companyId: string
}): Promise<void> => {
  await assertUserInCompany({ userId, companyId })
  const shiftPattern = await shiftPatternRepository.findUnique({
    id: shiftPatternId,
    companyId
  })
  if (!shiftPattern) {
    throw new ShiftPatternNotFoundError(
      `ShiftPattern ${shiftPatternId} not found in company ${companyId}`
    )
  }
  const version = selectVersionInEffect(shiftPattern.versions, startDate)
  if (version && cycleStartDay > version.cycleLength) {
    throwFieldError(
      'cycleStartDay',
      version.cycleLength === 1
        ? 'O ciclo da escala tem 1 dia'
        : `O ciclo da escala tem ${version.cycleLength} dias`,
      cycleStartDay
    )
  }

  const saved = await shiftAssignmentRepository.findManyByUserIds([userId])
  const others = saved.filter((assignment) => assignment.id !== id)
  const conflict = findShiftConflict(
    { id: id ?? '', startDate, endDate, cycleStartDay, shiftPattern },
    others
  )
  if (conflict) throw new ShiftConflictError(conflict)
}

const findManyByUserId = async (
  params: TShiftAssignmentFindManyByUserIdParams
): Promise<TShiftAssignmentWithPattern[]> => {
  const { userId, companyId } = findManyByUserIdParamsSchema.parse(params)
  await assertUserInCompany({ userId, companyId })
  return await shiftAssignmentRepository.findManyByUserIds([userId])
}

// The caller passes users already read from the company, so the ids need no scoping here
const findManyByUserIds = async (
  userIds: string[]
): Promise<TShiftAssignmentWithPattern[]> =>
  await shiftAssignmentRepository.findManyByUserIds(
    z.array(z.uuidv4()).parse(userIds)
  )

const create = async (
  data: TShiftAssignmentCreateData
): Promise<ShiftAssignment> => {
  const validData = createSchema.parse(data)
  await validateAssignment(validData)
  const { userId, shiftPatternId, startDate, endDate, cycleStartDay } =
    validData
  return await shiftAssignmentRepository.create({
    userId,
    shiftPatternId,
    startDate,
    endDate,
    cycleStartDay
  })
}

const findAssignment = async (params: {
  id: string
  companyId: string
}): Promise<ShiftAssignment> => {
  const assignment = await shiftAssignmentRepository.findUnique(params)
  if (!assignment) {
    throw new ShiftAssignmentNotFoundError(
      `ShiftAssignment ${params.id} not found in company ${params.companyId}`
    )
  }
  return assignment
}

const update = async (
  data: TShiftAssignmentUpdateData
): Promise<ShiftAssignment> => {
  const validData = updateSchema.parse(data)
  const { id, companyId, userId, shiftPatternId, startDate, endDate } =
    validData
  const assignment = await findAssignment({ id, companyId })
  if (assignment.userId !== userId) {
    throw new ShiftAssignmentNotFoundError(
      `ShiftAssignment ${id} not found for user ${userId}`
    )
  }
  await validateAssignment(validData)
  return await shiftAssignmentRepository.update({
    id,
    shiftPatternId,
    startDate,
    endDate,
    cycleStartDay: validData.cycleStartDay
  })
}

const remove = async (
  params: TShiftAssignmentRemoveParams
): Promise<ShiftAssignment> => {
  const validParams = removeSchema.parse(params)
  const assignment = await findAssignment(validParams)
  await shiftAssignmentRepository.remove(assignment.id)
  return assignment
}

const findUserDays = async (
  params: TShiftAssignmentFindUserDaysParams
): Promise<TResolvedDay[]> => {
  const { userId, companyId, initialDate, finalDate } =
    findUserDaysParamsSchema.parse(params)
  await assertUserInCompany({ userId, companyId })
  const [assignments, adjustments] = await Promise.all([
    shiftAssignmentRepository.findManyByUserIds([userId]),
    shiftAssignmentRepository.findAdjustmentsByUserId({
      userId,
      initialDate,
      finalDate
    })
  ])
  return resolveDays({ initialDate, finalDate, assignments, adjustments })
}

const findAdjustmentsByUserId = async (
  params: TShiftAssignmentFindManyByUserIdParams
): Promise<ShiftAdjustment[]> => {
  const { userId, companyId } = findManyByUserIdParamsSchema.parse(params)
  await assertUserInCompany({ userId, companyId })
  return await shiftAssignmentRepository.findAdjustmentsByUserId({ userId })
}

const saveAdjustment = async (
  data: TShiftAdjustmentSaveData
): Promise<ShiftAdjustment> => {
  const { companyId, ...adjustment } = saveAdjustmentSchema.parse(data)
  await assertUserInCompany({ userId: adjustment.userId, companyId })
  if (adjustment.shiftAssignmentId) {
    const assignment = await shiftAssignmentRepository.findUnique({
      id: adjustment.shiftAssignmentId,
      companyId
    })
    if (assignment?.userId !== adjustment.userId) {
      throw new ShiftAssignmentNotFoundError(
        `ShiftAssignment ${adjustment.shiftAssignmentId} not found for user ${adjustment.userId}`
      )
    }
    if (!isInEffect(assignment, adjustment.date)) {
      throwFieldError(
        'shiftAssignmentId',
        'A escala não está em vigor nesse dia',
        adjustment.shiftAssignmentId
      )
    }
  }
  return await shiftAssignmentRepository.saveAdjustment(adjustment)
}

const removeAdjustment = async (
  params: TShiftAdjustmentRemoveParams
): Promise<ShiftAdjustment> => {
  const validParams = removeAdjustmentSchema.parse(params)
  const adjustment = await shiftAssignmentRepository.findAdjustment(validParams)
  if (!adjustment) {
    throw new ShiftAdjustmentNotFoundError(
      `ShiftAdjustment ${validParams.id} not found in company ${validParams.companyId}`
    )
  }
  await shiftAssignmentRepository.removeAdjustment(adjustment.id)
  return adjustment
}

export const shiftAssignmentModel = {
  findManyByUserId,
  findManyByUserIds,
  create,
  update,
  remove,
  findUserDays,
  findAdjustmentsByUserId,
  saveAdjustment,
  removeAdjustment
}
