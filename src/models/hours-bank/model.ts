import { z } from 'zod'

import type {
  HoursBankAdjustment,
  HoursBankClosing,
  THoursBankClosingWithBalances,
  User
} from '@/infra/database/types'
import { dayjs, wallClockNow } from '@/infra/dayjs'
import { journeyModel } from '@/models/journey/model'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'
import { groupByDay, resolvePeriod } from '@/models/punch-record/utils'
import { selectInEffectSince } from '@/models/schedule/utils'
import { holidayRepository } from '@/repositories/holiday-repository'
import { hoursBankAdjustmentRepository } from '@/repositories/hours-bank-adjustment-repository'
import { hoursBankClosingRepository } from '@/repositories/hours-bank-closing-repository'
import { justificationRepository } from '@/repositories/justification-repository'
import { punchRecordRepository } from '@/repositories/punch-record-repository'
import { scheduleRepository } from '@/repositories/schedule-repository'
import { userRepository } from '@/repositories/user-repository'

import {
  HoursBankAdjustmentClosedError,
  HoursBankCloseError,
  HoursBankInitialBalanceError,
  HoursBankReopenError
} from './errors'
import {
  closeSchema,
  createAdjustmentSchema,
  generateSchema,
  initialBalanceSchema,
  removeAdjustmentSchema,
  reopenSchema,
  updateAdjustmentSchema
} from './schema'
import type {
  THoursBankAdjustmentCreateData,
  THoursBankAdjustmentRemoveParams,
  THoursBankAdjustmentUpdateData,
  THoursBankCloseParams,
  THoursBankGenerateParams,
  THoursBankInitialBalanceData,
  THoursBankReopenParams,
  THoursBankReport,
  THoursBankRow
} from './types'
import {
  calculateBalance,
  findCloseIssue,
  getNextStartDate,
  isInClosedPeriod,
  sortRows,
  sumJourneys
} from './utils'

const today = (): string => wallClockNow().format('YYYY-MM-DD')

const toSavedRows = (closing: THoursBankClosingWithBalances): THoursBankRow[] =>
  closing.balances.map(({ user, ...balance }) => ({
    userId: user.id,
    name: user.name,
    pis: user.pis,
    previousBalance: balance.previousBalance,
    absence: balance.absence,
    lateness: balance.lateness,
    dayOff: balance.dayOff,
    overtime60: balance.overtime60,
    overtime100: balance.overtime100,
    adjustment: balance.adjustment,
    balance: balance.balance
  }))

const calculateRows = async ({
  companyId,
  users,
  period,
  adjustments
}: {
  companyId: string
  users: User[]
  period: TPunchRecordPeriod
  adjustments: HoursBankAdjustment[]
}): Promise<THoursBankRow[]> => {
  if (users.length === 0) return []

  const userIds = users.map(({ id }) => id)
  const { initialDate, finalDate } = period
  const [previousClosing, punchRecords, schedules, justifications, holidays] =
    await Promise.all([
      hoursBankClosingRepository.findLastEndedBefore({
        companyId,
        date: initialDate
      }),
      punchRecordRepository.findMany({
        initialDate: dayjs(initialDate).startOf('day').toDate(),
        finalDate: dayjs(finalDate).endOf('day').toDate(),
        pisList: users.map(({ pis }) => pis)
      }),
      scheduleRepository.findManyStartedUntilByUserIds({
        userIds,
        date: finalDate
      }),
      justificationRepository.findManyInPeriodByUserIds({
        userIds,
        initialDate,
        finalDate
      }),
      holidayRepository.findManyByCompanyId(companyId)
    ])

  return users.map((user) => {
    const days = journeyModel.calculateDays({
      days: groupByDay(
        punchRecords.filter(({ pis }) => pis === user.pis),
        period
      ),
      schedules: selectInEffectSince(
        schedules.filter(({ userId }) => userId === user.id),
        initialDate
      ),
      holidays,
      justifications: justifications.filter(({ userId }) => userId === user.id)
    })
    const totals = {
      ...sumJourneys(days),
      adjustment: adjustments
        .filter(({ userId }) => userId === user.id)
        .reduce((total, { minutes }) => total + minutes, 0)
    }
    const previousBalance =
      previousClosing?.balances.find(({ userId }) => userId === user.id)
        ?.balance ?? 0
    return {
      userId: user.id,
      name: user.name,
      pis: user.pis,
      previousBalance,
      ...totals,
      balance: calculateBalance({ previousBalance, ...totals })
    }
  })
}

const generate = async (
  params: THoursBankGenerateParams
): Promise<THoursBankReport> => {
  const { companyId, order, ...dates } = generateSchema.parse(params)
  const lastClosing = await hoursBankClosingRepository.findLast(companyId)
  const period = resolvePeriod({
    initialDate:
      dates.initialDate ?? getNextStartDate(lastClosing) ?? undefined,
    finalDate: dates.finalDate
  })
  const users = await userRepository.findManyByCompanyId(companyId)
  const adjustments = await hoursBankAdjustmentRepository.findManyInPeriod({
    userIds: users.map(({ id }) => id),
    ...period
  })
  const closing = await hoursBankClosingRepository.findUniqueByPeriod({
    companyId,
    startDate: period.initialDate,
    endDate: period.finalDate
  })
  const rows = closing
    ? toSavedRows(closing)
    : await calculateRows({ companyId, users, period, adjustments })
  return {
    period,
    order,
    closing,
    lastClosing,
    closeIssue: closing
      ? null
      : findCloseIssue({ period, lastClosing, today: today() }),
    rows: sortRows(rows, order),
    adjustments
  }
}

const close = async (
  params: THoursBankCloseParams
): Promise<HoursBankClosing> => {
  const { companyId, ...period } = closeSchema.parse(params)
  const lastClosing = await hoursBankClosingRepository.findLast(companyId)
  const issue = findCloseIssue({ period, lastClosing, today: today() })
  if (issue) throw new HoursBankCloseError(issue)

  const users = await userRepository.findManyByCompanyId(companyId)
  const adjustments = await hoursBankAdjustmentRepository.findManyInPeriod({
    userIds: users.map(({ id }) => id),
    ...period
  })
  const rows = await calculateRows({ companyId, users, period, adjustments })
  return await hoursBankClosingRepository.create({
    companyId,
    startDate: period.initialDate,
    endDate: period.finalDate,
    initial: false,
    balances: rows.map((row) => ({
      userId: row.userId,
      previousBalance: row.previousBalance,
      absence: row.absence,
      lateness: row.lateness,
      dayOff: row.dayOff,
      overtime60: row.overtime60,
      overtime100: row.overtime100,
      adjustment: row.adjustment,
      balance: row.balance
    }))
  })
}

const createInitialBalance = async (
  data: THoursBankInitialBalanceData
): Promise<HoursBankClosing> => {
  const { companyId, startDate, endDate, balances } =
    initialBalanceSchema.parse(data)
  const lastClosing = await hoursBankClosingRepository.findLast(companyId)
  if (lastClosing) throw new HoursBankInitialBalanceError()

  return await hoursBankClosingRepository.create({
    companyId,
    startDate,
    endDate,
    initial: true,
    balances: balances.map((totals) => {
      const balance = { previousBalance: 0, lateness: 0, ...totals }
      return { ...balance, balance: calculateBalance(balance) }
    })
  })
}

const reopen = async (
  params: THoursBankReopenParams
): Promise<HoursBankClosing> => {
  const { id, companyId } = reopenSchema.parse(params)
  const lastClosing = await hoursBankClosingRepository.findLast(companyId)
  if (lastClosing?.id !== id) throw new HoursBankReopenError()
  const closing = await hoursBankClosingRepository.remove({ id, companyId })
  if (!closing) {
    throw new Error(`HoursBankClosing ${id} not found in company ${companyId}`)
  }
  return closing
}

const assertUserInCompany = async (
  userId: string,
  companyId: string
): Promise<void> => {
  const user = await userRepository.findUniqueById(userId)
  if (user?.companyId !== companyId) {
    throw new Error(`User ${userId} not found in company ${companyId}`)
  }
}

const assertOpenDate = async (
  date: string,
  companyId: string
): Promise<void> => {
  const lastClosing = await hoursBankClosingRepository.findLast(companyId)
  if (!isInClosedPeriod(date, lastClosing)) return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['date'],
      message: `A data está num período fechado (até ${dayjs(lastClosing?.endDate).format('DD/MM/YYYY')})`,
      input: date
    }
  ])
}

const findOwnedAdjustment = async ({
  id,
  companyId
}: {
  id: string
  companyId: string
}): Promise<HoursBankAdjustment> => {
  const adjustment = await hoursBankAdjustmentRepository.findUniqueById(id)
  if (adjustment) {
    const user = await userRepository.findUniqueById(adjustment.userId)
    if (user?.companyId === companyId) return adjustment
  }
  throw new Error(`HoursBankAdjustment ${id} not found in company ${companyId}`)
}

const assertOpenAdjustment = async (
  adjustment: HoursBankAdjustment,
  companyId: string
): Promise<void> => {
  const lastClosing = await hoursBankClosingRepository.findLast(companyId)
  if (isInClosedPeriod(adjustment.date, lastClosing)) {
    throw new HoursBankAdjustmentClosedError()
  }
}

const createAdjustment = async (
  data: THoursBankAdjustmentCreateData
): Promise<HoursBankAdjustment> => {
  const { companyId, ...validData } = createAdjustmentSchema.parse(data)
  await assertUserInCompany(validData.userId, companyId)
  await assertOpenDate(validData.date, companyId)
  return await hoursBankAdjustmentRepository.create(validData)
}

const updateAdjustment = async (
  data: THoursBankAdjustmentUpdateData
): Promise<HoursBankAdjustment> => {
  const { companyId, ...validData } = updateAdjustmentSchema.parse(data)
  const saved = await findOwnedAdjustment({ id: validData.id, companyId })
  await assertOpenAdjustment(saved, companyId)
  await assertUserInCompany(validData.userId, companyId)
  await assertOpenDate(validData.date, companyId)
  const adjustment = await hoursBankAdjustmentRepository.update(validData)
  if (!adjustment) {
    throw new Error(`HoursBankAdjustment ${validData.id} not found`)
  }
  return adjustment
}

const removeAdjustment = async (
  params: THoursBankAdjustmentRemoveParams
): Promise<HoursBankAdjustment> => {
  const { id, companyId } = removeAdjustmentSchema.parse(params)
  const adjustment = await findOwnedAdjustment({ id, companyId })
  await assertOpenAdjustment(adjustment, companyId)
  await hoursBankAdjustmentRepository.remove(id)
  return adjustment
}

export const hoursBankModel = {
  generate,
  close,
  createInitialBalance,
  reopen,
  createAdjustment,
  updateAdjustment,
  removeAdjustment
}
