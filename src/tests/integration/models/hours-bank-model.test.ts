import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import type { User } from '@/infra/database/types'
import { companyModel } from '@/models/company/model'
import {
  HoursBankAdjustmentClosedError,
  HoursBankCloseError,
  HoursBankReopenError
} from '@/models/hours-bank/errors'
import { hoursBankModel } from '@/models/hours-bank/model'
import { justificationModel } from '@/models/justification/model'
import { justificationTypeModel } from '@/models/justification-type/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { scheduleModel } from '@/models/schedule/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const FIRST_PERIOD = { initialDate: '2026-10-05', finalDate: '2026-10-10' }
const SECOND_PERIOD = { initialDate: '2026-10-11', finalDate: '2026-10-17' }

let companyId: string
let otherCompanyId: string
let scheduled: User
let unscheduled: User
let otherUser: User
let adjustmentId: string
let firstClosingId: string
let secondClosingId: string

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.upsert({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  return id
}

const punch = async (pis: string, date: string, ...times: string[]) => {
  for (const time of times) {
    await punchRecordModel.createNonExistentInAfd({
      pis,
      datetime: new Date(`${date}T${time}:00.000Z`)
    })
  }
}

const findRow = (
  rows: Awaited<ReturnType<typeof hoursBankModel.generate>>['rows'],
  userId: string
) => rows.find((row) => row.userId === userId)

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()

  companyId = await createCompany()
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 2), companyId)
  )
  ;[scheduled, unscheduled] = await userModel.findManyByCompanyId(companyId)
  otherCompanyId = await createCompany()
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(2, 3), otherCompanyId)
  )
  ;[otherUser] = await userModel.findManyByCompanyId(otherCompanyId)

  await scheduleModel.save({
    companyId,
    userId: scheduled.id,
    startDate: '2026-01-01',
    ...Object.fromEntries(
      [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
      ].flatMap((weekday) => [
        [`${weekday}Entry1`, '07:00'],
        [`${weekday}Exit1`, '11:00']
      ])
    )
  })
  const dayOffType = await justificationTypeModel.create({
    companyId,
    code: 'FOLGA',
    description: 'Folga',
    effect: 'deduct'
  })
  await justificationModel.create({
    companyId,
    userId: scheduled.id,
    typeId: dayOffType.id,
    startDate: '2026-10-07',
    endDate: '2026-10-07'
  })

  await punch(scheduled.pis, '2026-10-05', '07:00', '11:00')
  await punch(scheduled.pis, '2026-10-06', '07:00', '12:00')
  await punch(scheduled.pis, '2026-10-09', '07:30', '11:00')
  await punch(scheduled.pis, '2026-10-10', '07:00', '11:00')
})

describe('Hours Bank Model', () => {
  test('Sums the journey of each day of the period by employee', async () => {
    const adjustment = await hoursBankModel.createAdjustment({
      companyId,
      userId: scheduled.id,
      date: '2026-10-06',
      minutes: '01:00',
      reason: 'Reunião fora do horário'
    })
    adjustmentId = adjustment.id

    const report = await hoursBankModel.generate({ companyId, ...FIRST_PERIOD })

    expect(report.period).toEqual(FIRST_PERIOD)
    expect(report.closing).toBeNull()
    expect(report.closeIssue).toBeNull()
    expect(findRow(report.rows, scheduled.id)).toEqual({
      userId: scheduled.id,
      name: scheduled.name,
      pis: scheduled.pis,
      previousBalance: 0,
      absence: 240,
      lateness: 30,
      dayOff: 240,
      overtime60: 60,
      overtime100: 0,
      adjustment: 60,
      balance: -390
    })
    expect(findRow(report.rows, unscheduled.id)).toMatchObject({ balance: 0 })
    expect(report.adjustments.map(({ id }) => id)).toEqual([adjustmentId])
  })

  test('Orders the employees by balance or by name', async () => {
    const byBalance = await hoursBankModel.generate({
      companyId,
      ...FIRST_PERIOD
    })
    expect(byBalance.rows.map(({ userId }) => userId)).toEqual([
      unscheduled.id,
      scheduled.id
    ])

    const byName = await hoursBankModel.generate({
      companyId,
      ...FIRST_PERIOD,
      order: 'name'
    })
    expect(byName.rows.map(({ name }) => name)).toEqual(
      [scheduled.name, unscheduled.name].toSorted((first, second) =>
        first.localeCompare(second)
      )
    )
  })

  test('Keeps the saved balances of a closed period', async () => {
    const closing = await hoursBankModel.close({ companyId, ...FIRST_PERIOD })
    firstClosingId = closing.id
    await punch(scheduled.pis, '2026-10-08', '07:00', '11:00')

    const report = await hoursBankModel.generate({ companyId, ...FIRST_PERIOD })
    expect(report.closing?.id).toBe(closing.id)
    expect(findRow(report.rows, scheduled.id)).toMatchObject({
      absence: 240,
      balance: -390
    })
  })

  test('Starts the next period after the last closing with its balance', async () => {
    const report = await hoursBankModel.generate({
      companyId,
      finalDate: SECOND_PERIOD.finalDate
    })

    expect(report.period).toEqual(SECOND_PERIOD)
    expect(report.closeIssue).toBeNull()
    expect(findRow(report.rows, scheduled.id)).toMatchObject({
      previousBalance: -390
    })
  })

  test('Rejects closing a period that does not follow the last closing or ends after today', async () => {
    await expect(
      hoursBankModel.close({
        companyId,
        initialDate: '2026-10-12',
        finalDate: SECOND_PERIOD.finalDate
      })
    ).rejects.toBeInstanceOf(HoursBankCloseError)
    await expect(
      hoursBankModel.close({
        companyId,
        initialDate: SECOND_PERIOD.initialDate,
        finalDate: '2100-01-01'
      })
    ).rejects.toBeInstanceOf(HoursBankCloseError)
  })

  test('Keeps the adjustments of a closed period from changing', async () => {
    const promise = hoursBankModel.createAdjustment({
      companyId,
      userId: scheduled.id,
      date: FIRST_PERIOD.finalDate,
      minutes: '-00:30',
      reason: 'Correção'
    })
    await expect(promise).rejects.toBeInstanceOf(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [{ path: ['date'] }]
    })
    await expect(
      hoursBankModel.removeAdjustment({ id: adjustmentId, companyId })
    ).rejects.toBeInstanceOf(HoursBankAdjustmentClosedError)
    await expect(
      hoursBankModel.updateAdjustment({
        id: adjustmentId,
        companyId,
        userId: scheduled.id,
        date: SECOND_PERIOD.initialDate,
        minutes: '01:00',
        reason: 'Reunião fora do horário'
      })
    ).rejects.toBeInstanceOf(HoursBankAdjustmentClosedError)
  })

  test('Reopens only the last closed period', async () => {
    const secondClosing = await hoursBankModel.close({
      companyId,
      ...SECOND_PERIOD
    })
    secondClosingId = secondClosing.id

    await expect(
      hoursBankModel.reopen({ id: firstClosingId, companyId })
    ).rejects.toBeInstanceOf(HoursBankReopenError)
    await hoursBankModel.reopen({ id: secondClosingId, companyId })

    const report = await hoursBankModel.generate({
      companyId,
      ...SECOND_PERIOD
    })
    expect(report.closing).toBeNull()
    expect(report.lastClosing?.id).toBe(firstClosingId)
  })
})

describe('Hours Bank Adjustments', () => {
  test('Saves a negative adjustment and updates and removes it', async () => {
    const adjustment = await hoursBankModel.createAdjustment({
      companyId,
      userId: scheduled.id,
      date: SECOND_PERIOD.initialDate,
      minutes: '-01:30',
      reason: 'Saída antecipada autorizada'
    })
    expect(adjustment.minutes).toBe(-90)

    const updated = await hoursBankModel.updateAdjustment({
      id: adjustment.id,
      companyId,
      userId: scheduled.id,
      date: SECOND_PERIOD.finalDate,
      minutes: '+02:15',
      reason: 'Saída antecipada autorizada'
    })
    expect(updated).toMatchObject({
      date: SECOND_PERIOD.finalDate,
      minutes: 135
    })

    await hoursBankModel.removeAdjustment({ id: adjustment.id, companyId })
    const report = await hoursBankModel.generate({
      companyId,
      ...SECOND_PERIOD
    })
    expect(report.adjustments).toEqual([])
  })

  test('Rejects an empty adjustment or one of an employee of another company', async () => {
    const promise = hoursBankModel.createAdjustment({
      companyId,
      userId: scheduled.id,
      date: SECOND_PERIOD.initialDate,
      minutes: '00:00',
      reason: ' '
    })
    await expect(promise).rejects.toBeInstanceOf(z.ZodError)
    await expect(promise).rejects.toMatchObject({
      issues: [
        { path: ['minutes'], message: 'O ajuste não pode ser zero' },
        { path: ['reason'], message: 'Informe o motivo' }
      ]
    })
    await expect(
      hoursBankModel.createAdjustment({
        companyId,
        userId: otherUser.id,
        date: SECOND_PERIOD.initialDate,
        minutes: '01:00',
        reason: 'Correção'
      })
    ).rejects.toThrow(/not found in company/)
  })
})
