import { z } from 'zod'

import type {
  RestRestriction,
  TRestRestrictionWithRelations
} from '@/infra/database/types'
import { wallClockNow } from '@/infra/dayjs'
import { getRestPlanningFinalDate } from '@/models/rest-rule/utils'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { isInEffect } from '@/models/shift-assignment/utils'
import { INACTIVE_USER_STATUSES, type TUserStatus } from '@/models/user/utils'
import { getGroupLabel } from '@/models/user-group/utils'
import { restRestrictionRepository } from '@/repositories/rest-restriction-repository'
import { userGroupRepository } from '@/repositories/user-group-repository'
import { userRepository } from '@/repositories/user-repository'

import { RestRestrictionNotFoundError } from './errors'
import {
  companyIdSchema,
  createSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TAssignmentRestBreak,
  TRestRestrictionCreateData,
  TRestRestrictionRemoveParams,
  TRestRestrictionUpdateData
} from './types'
import {
  findRestBreaks,
  toRestRestrictionInput,
  type TRestRestrictionInput
} from './utils'

const DATE_FORMAT = 'YYYY-MM-DD'

const throwFieldError = (
  path: string,
  message: string,
  input: unknown
): never => {
  throw new z.ZodError([{ code: 'custom', path: [path], message, input }])
}

const validateRestriction = async ({
  id,
  companyId,
  userIds,
  userGroupId,
  userId
}: {
  id?: string
  companyId: string
  userIds: string[]
  userGroupId: string | null
  userId: string | null
}): Promise<void> => {
  const [restrictions, users, groups] = await Promise.all([
    restRestrictionRepository.findManyByCompanyId(companyId),
    userRepository.findManyByCompanyId(companyId),
    userGroupRepository.findManyByCompanyId(companyId)
  ])
  const others = restrictions.filter((restriction) => restriction.id !== id)
  const usersById = new Map(users.map((user) => [user.id, user]))
  if (userIds.some((selectedId) => !usersById.has(selectedId))) {
    throwFieldError(
      'userIds',
      'Um dos funcionários não foi encontrado',
      userIds
    )
  }
  if (userGroupId) {
    if (groups.every((group) => group.id !== userGroupId)) {
      throwFieldError('userGroupId', 'O grupo não foi encontrado', userGroupId)
    }
    if (others.some((other) => other.userGroupId === userGroupId)) {
      throwFieldError(
        'userGroupId',
        `O grupo ${getGroupLabel(groups, userGroupId)} já tem um limite`,
        userGroupId
      )
    }
  }
  if (!userId) return
  const user = usersById.get(userId)
  if (!user) {
    throwFieldError('userId', 'O funcionário não foi encontrado', userId)
  }
  if (others.some((other) => other.userId === userId)) {
    throwFieldError(
      'userId',
      `${user!.name} já tem dias da semana proibidos`,
      userId
    )
  }
}

const findRestriction = async (params: {
  id: string
  companyId: string
}): Promise<TRestRestrictionWithRelations> => {
  const restriction = await restRestrictionRepository.findUnique(params)
  if (!restriction) {
    throw new RestRestrictionNotFoundError(
      `RestRestriction ${params.id} not found in company ${params.companyId}`
    )
  }
  return restriction
}

const findManyByCompanyId = async (
  companyId: string
): Promise<TRestRestrictionWithRelations[]> =>
  await restRestrictionRepository.findManyByCompanyId(
    companyIdSchema.parse(companyId)
  )

const findInputsByCompanyId = async (
  companyId: string
): Promise<TRestRestrictionInput[]> => {
  const validCompanyId = companyIdSchema.parse(companyId)
  const [restrictions, groups, members] = await Promise.all([
    restRestrictionRepository.findManyByCompanyId(validCompanyId),
    userGroupRepository.findManyByCompanyId(validCompanyId),
    userGroupRepository.findMembersByCompanyId(validCompanyId)
  ])
  return restrictions.map((restriction) =>
    toRestRestrictionInput(restriction, { groups, members })
  )
}

const create = async (
  data: TRestRestrictionCreateData
): Promise<RestRestriction> => {
  const validData = createSchema.parse(data)
  await validateRestriction(validData)
  return await restRestrictionRepository.save(validData)
}

const update = async (
  data: TRestRestrictionUpdateData
): Promise<RestRestriction> => {
  const validData = updateSchema.parse(data)
  await findRestriction(validData)
  await validateRestriction(validData)
  return await restRestrictionRepository.save(validData)
}

const remove = async (
  params: TRestRestrictionRemoveParams
): Promise<TRestRestrictionWithRelations> => {
  const validParams = removeSchema.parse(params)
  const restriction = await findRestriction(validParams)
  await restRestrictionRepository.remove(restriction.id)
  return restriction
}

// Only the days off of the schedule warn the link: an adjusted day was planned by hand or by a rest rule
const findAssignmentBreaks = async (
  companyId: string
): Promise<Record<string, TAssignmentRestBreak[]>> => {
  const validCompanyId = companyIdSchema.parse(companyId)
  const today = wallClockNow().format(DATE_FORMAT)
  const [restrictions, users, companyDays] = await Promise.all([
    findInputsByCompanyId(validCompanyId),
    userRepository.findManyByCompanyId(validCompanyId),
    shiftAssignmentModel.findCompanyDays({
      companyId: validCompanyId,
      initialDate: today,
      finalDate: getRestPlanningFinalDate(today)
    })
  ])
  const activeIds = new Set(
    users
      .filter(
        ({ status }) => !INACTIVE_USER_STATUSES.includes(status as TUserStatus)
      )
      .map(({ id }) => id)
  )
  const activeDays = companyDays.filter(({ userId }) => activeIds.has(userId))
  const assignmentsByUserId = new Map(
    activeDays.map(({ userId, assignments }) => [userId, assignments])
  )
  const restBreaks = findRestBreaks({ restrictions, users: activeDays })
  const breaks: Record<string, TAssignmentRestBreak[]> = {}
  for (const { userId, date, adjusted, restriction } of restBreaks) {
    if (adjusted) continue
    const assignments = assignmentsByUserId.get(userId) ?? []
    for (const assignment of assignments) {
      if (!isInEffect(assignment, date)) continue
      breaks[assignment.id] = [
        ...(breaks[assignment.id] ?? []),
        { date, restriction }
      ]
    }
  }
  return breaks
}

export const restRestrictionModel = {
  findManyByCompanyId,
  findInputsByCompanyId,
  create,
  update,
  remove,
  findAssignmentBreaks
}
