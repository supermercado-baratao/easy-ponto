import { z } from 'zod'

import type { RestRule, TRestRuleWithRelations } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { findHoliday } from '@/models/holiday/utils'
import { restRestrictionModel } from '@/models/rest-restriction/model'
import { INACTIVE_USER_STATUSES, type TUserStatus } from '@/models/user/utils'
import { holidayRepository } from '@/repositories/holiday-repository'
import { restRuleRepository } from '@/repositories/rest-rule-repository'
import { shiftAssignmentRepository } from '@/repositories/shift-assignment-repository'
import { shiftPatternRepository } from '@/repositories/shift-pattern-repository'
import { userRepository } from '@/repositories/user-repository'

import { RestRuleNotFoundError } from './errors'
import {
  companyIdSchema,
  createSchema,
  periodSchema,
  planMonthsSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TRestGenerateResult,
  TRestPlan,
  TRestPreview,
  TRestRuleCreateData,
  TRestRulePeriodParams,
  TRestRulePlanMonthsParams,
  TRestRuleRemoveParams,
  TRestRuleUpdateData
} from './types'
import {
  isSameRestRuleName,
  planRestMonth,
  toRestRuleInput,
  type TRuleAdjustment
} from './utils'

const DATE_FORMAT = 'YYYY-MM-DD'

const throwFieldError = (
  path: string,
  message: string,
  input: unknown
): never => {
  throw new z.ZodError([{ code: 'custom', path: [path], message, input }])
}

const validateRule = async ({
  id,
  companyId,
  name,
  shiftPatternIds
}: {
  id?: string
  companyId: string
  name: string
  shiftPatternIds: string[]
}): Promise<void> => {
  const [rules, patterns] = await Promise.all([
    restRuleRepository.findManyByCompanyId(companyId),
    shiftPatternRepository.findManyByCompanyId(companyId)
  ])
  const others = rules.filter((rule) => rule.id !== id)
  if (others.some((rule) => isSameRestRuleName(rule.name, name))) {
    throwFieldError('name', 'Já existe uma regra com esse nome', name)
  }
  const patternIds = new Set(patterns.map((pattern) => pattern.id))
  if (shiftPatternIds.some((patternId) => !patternIds.has(patternId))) {
    throwFieldError(
      'shiftPatternIds',
      'Uma das escalas não foi encontrada',
      shiftPatternIds
    )
  }
  for (const rule of others) {
    const taken = rule.shiftPatterns.find(({ shiftPatternId }) =>
      shiftPatternIds.includes(shiftPatternId)
    )
    if (!taken) continue
    const pattern = patterns.find(({ id }) => id === taken.shiftPatternId)
    throwFieldError(
      'shiftPatternIds',
      pattern
        ? `A escala ${pattern.name} já segue a regra ${rule.name}`
        : `Uma das escalas já segue a regra ${rule.name}`,
      shiftPatternIds
    )
  }
}

const findRule = async (params: {
  id: string
  companyId: string
}): Promise<TRestRuleWithRelations> => {
  const rule = await restRuleRepository.findUnique(params)
  if (!rule) {
    throw new RestRuleNotFoundError(
      `RestRule ${params.id} not found in company ${params.companyId}`
    )
  }
  return rule
}

const findManyByCompanyId = async (
  companyId: string
): Promise<TRestRuleWithRelations[]> =>
  await restRuleRepository.findManyByCompanyId(companyIdSchema.parse(companyId))

const create = async (data: TRestRuleCreateData): Promise<RestRule> => {
  const validData = createSchema.parse(data)
  await validateRule(validData)
  return await restRuleRepository.save(validData)
}

const update = async (data: TRestRuleUpdateData): Promise<RestRule> => {
  const validData = updateSchema.parse(data)
  await findRule(validData)
  await validateRule(validData)
  return await restRuleRepository.save(validData)
}

const remove = async (params: TRestRuleRemoveParams): Promise<RestRule> => {
  const validParams = removeSchema.parse(params)
  const rule = await findRule(validParams)
  await restRuleRepository.remove(rule.id)
  return rule
}

const getPeriod = (
  month: string
): { initialDate: string; finalDate: string } => {
  const first = dayjs(`${month}-01`)
  return {
    initialDate: first.format(DATE_FORMAT),
    finalDate: first.endOf('month').format(DATE_FORMAT)
  }
}

const planMonths = async (
  params: TRestRulePlanMonthsParams
): Promise<TRestPlan> => {
  const { companyId, months } = planMonthsSchema.parse(params)
  const periods = months.map((month) => ({ month, ...getPeriod(month) }))
  const [rules, holidays, users, restrictions] = await Promise.all([
    restRuleRepository.findManyByCompanyId(companyId),
    holidayRepository.findManyByCompanyId(companyId),
    userRepository.findManyByCompanyId(companyId),
    restRestrictionModel.findInputsByCompanyId(companyId)
  ])
  const activeUsers = users.filter(
    ({ status }) => !INACTIVE_USER_STATUSES.includes(status as TUserStatus)
  )
  const activeIds = activeUsers.map(({ id }) => id)
  const [assignments, adjustments] = await Promise.all([
    shiftAssignmentRepository.findManyByUserIds(activeIds),
    shiftAssignmentRepository.findAdjustmentsByUserIds({
      userIds: activeIds,
      initialDate: periods[0].initialDate,
      finalDate: periods.at(-1)!.finalDate
    })
  ])
  const ruleInputs = rules.map((rule) => toRestRuleInput(rule))
  const isHoliday = (date: string): boolean => !!findHoliday(date, holidays)
  return {
    users,
    activeUsers,
    rules,
    restrictions,
    holidays,
    months: periods.map(({ month, initialDate, finalDate }) => ({
      month,
      initialDate,
      finalDate,
      ...planRestMonth({
        rules: ruleInputs,
        restrictions,
        isHoliday,
        initialDate,
        finalDate,
        users: activeIds.map((userId) => ({
          userId,
          assignments: assignments.filter(
            (assignment) => assignment.userId === userId
          ),
          adjustments: adjustments.filter(
            (adjustment) =>
              adjustment.userId === userId &&
              adjustment.date >= initialDate &&
              adjustment.date <= finalDate
          )
        }))
      })
    }))
  }
}

const computeMoves = async (
  params: TRestRulePeriodParams
): Promise<
  TRestPreview & { userIds: string[]; adjustments: TRuleAdjustment[] }
> => {
  const { companyId, month } = periodSchema.parse(params)
  const { users, activeUsers, months } = await planMonths({
    companyId,
    months: [month]
  })
  const [{ initialDate, finalDate, moves, adjustments }] = months
  const names = new Map(activeUsers.map(({ id, name }) => [id, name]))
  return {
    initialDate,
    finalDate,
    userIds: users.map(({ id }) => id),
    adjustments,
    moves: moves.map((move) => ({
      ...move,
      userName: names.get(move.userId) ?? ''
    }))
  }
}

const preview = async (
  params: TRestRulePeriodParams
): Promise<TRestPreview> => {
  const { initialDate, finalDate, moves } = await computeMoves(params)
  return { initialDate, finalDate, moves }
}

const generate = async (
  params: TRestRulePeriodParams
): Promise<TRestGenerateResult> => {
  const { initialDate, finalDate, userIds, moves, adjustments } =
    await computeMoves(params)
  await restRuleRepository.replaceRuleAdjustments({
    userIds,
    initialDate,
    finalDate,
    adjustments
  })
  return {
    moved: moves.filter(({ target }) => target !== null).length,
    unmoved: moves.filter(({ target }) => target === null).length
  }
}

export const restRuleModel = {
  findManyByCompanyId,
  create,
  update,
  remove,
  preview,
  generate,
  planMonths
}
