import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { companyModel } from '@/models/company/model'
import { holidayModel } from '@/models/holiday/model'
import { RestRuleNotFoundError } from '@/models/rest-rule/errors'
import { restRuleModel } from '@/models/rest-rule/model'
import type { TRestRuleCreateData } from '@/models/rest-rule/types'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.create({
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

// Monday to Saturday from 08:00 to 16:00, with Sunday off
const createSixByOne = async (
  companyId: string,
  name: string
): Promise<string> => {
  const times = Object.fromEntries(
    [1, 2, 3, 4, 5, 6].flatMap((day) => [
      [`day${day}Entry1`, '08:00'],
      [`day${day}Exit1`, '16:00']
    ])
  )
  const { id } = await shiftPatternModel.create({
    companyId,
    name,
    startDate: '2027-01-01',
    cycleLength: '7',
    ...times
  })
  return id
}

const getFieldErrors = async (
  promise: Promise<unknown>
): Promise<{ path: string; message: string }[]> => {
  let error: unknown
  try {
    await promise
  } catch (error_) {
    error = error_
  }
  expect(error).toBeInstanceOf(z.ZodError)
  return (error as z.ZodError).issues.map(({ path, message }) => ({
    path: path.join('.'),
    message
  }))
}

let companyId: string
let otherCompanyId: string
let userId: string
let patternId: string
let otherPatternId: string

const findAdjustments = async (): Promise<
  { date: string; kind: string; origin: string }[]
> => {
  const adjustments = await shiftAssignmentModel.findAdjustmentsByUserId({
    userId,
    companyId
  })
  return adjustments.map(({ date, kind, origin }) => ({ date, kind, origin }))
}

const ruleData = (
  data: Partial<TRestRuleCreateData> = {}
): TRestRuleCreateData => ({
  companyId,
  name: 'Folga na janela',
  shiftPatternIds: [patternId],
  windowStartDay: '5',
  windowEndDay: '25',
  distances: '2, 4, 6, 1',
  holidayRest: 'window',
  ...data
})

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  companyId = await createCompany()
  otherCompanyId = await createCompany()
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 1), companyId)
  )
  ;[{ id: userId }] = await userModel.findManyByCompanyId(companyId)
  patternId = await createSixByOne(companyId, '6x1')
  otherPatternId = await createSixByOne(companyId, '6x1 tarde')
  // The cycle starts on Monday, March 1, 2027, so the days off are the Sundays
  await shiftAssignmentModel.create({
    companyId,
    userId,
    shiftPatternId: patternId,
    startDate: '2027-03-01',
    cycleStartDay: '1'
  })
})

describe('Rest Rule Model', () => {
  test('Saves a rule with its patterns and the levels of its constraints', async () => {
    const rule = await restRuleModel.create(
      ruleData({
        blockedWeekdays: ['6', '1'],
        blockedWeekdaysLevel: 'required',
        sameLoadLevel: 'preferred',
        sameLoadPosition: '1'
      })
    )

    const [saved] = await restRuleModel.findManyByCompanyId(companyId)
    expect(saved).toMatchObject({
      id: rule.id,
      distances: [2, 4, 6, 1],
      blockedWeekdays: [1, 6],
      shiftPatterns: [{ shiftPatternId: patternId }]
    })
    expect(
      saved.constraints.map(({ constraint, level, position }) => ({
        constraint,
        level,
        position
      }))
    ).toEqual([
      { constraint: 'blocked-weekdays', level: 'required', position: null },
      { constraint: 'same-load', level: 'preferred', position: 1 }
    ])

    await restRuleModel.update({ ...ruleData({ distances: '3' }), id: rule.id })
    const [updated] = await restRuleModel.findManyByCompanyId(companyId)
    expect(updated).toMatchObject({ distances: [3], blockedWeekdays: [] })
    expect(updated.constraints).toEqual([])

    await restRuleModel.remove({ id: rule.id, companyId })
  })

  test('Refuses a pattern that already follows another rule', async () => {
    const rule = await restRuleModel.create(ruleData())

    const promise = restRuleModel.create(
      ruleData({
        name: 'Outra regra',
        shiftPatternIds: [otherPatternId, patternId]
      })
    )

    expect(await getFieldErrors(promise)).toEqual([
      {
        path: 'shiftPatternIds',
        message: 'A escala 6x1 já segue a regra Folga na janela'
      }
    ])

    await restRuleModel.remove({ id: rule.id, companyId })
  })

  test('Refuses two preferred constraints in the same position', async () => {
    const promise = restRuleModel.create(
      ruleData({
        sameMonthLevel: 'preferred',
        sameMonthPosition: '1',
        sameLoadLevel: 'preferred',
        sameLoadPosition: '1'
      })
    )

    expect(await getFieldErrors(promise)).toEqual([
      {
        path: 'sameLoadPosition',
        message: 'Outra restrição preferencial já tem essa ordem'
      }
    ])
  })

  test('Does not remove a rule of another company', async () => {
    const rule = await restRuleModel.create(ruleData())

    await expect(
      restRuleModel.remove({ id: rule.id, companyId: otherCompanyId })
    ).rejects.toBeInstanceOf(RestRuleNotFoundError)

    await restRuleModel.remove({ id: rule.id, companyId })
  })

  describe('Generation', () => {
    let ruleId: string

    beforeAll(async () => {
      ;({ id: ruleId } = await restRuleModel.create(
        ruleData({ windowStartDay: '10', noHolidayLevel: 'required' })
      ))
      await holidayModel.create({
        companyId,
        date: '2027-03-11',
        name: 'Feriado municipal',
        scope: 'municipal',
        recurrence: 'once'
      })
    })

    test('Previews the moves without saving them', async () => {
      const { moves } = await restRuleModel.preview({
        companyId,
        month: '2027-03'
      })

      expect(
        moves.map(({ date, target, ruleId: moveRuleId }) => ({
          date,
          target,
          ruleId: moveRuleId
        }))
      ).toEqual([
        { date: '2027-03-07', target: '2027-03-13', ruleId },
        { date: '2027-03-28', target: '2027-03-24', ruleId }
      ])
      expect(await findAdjustments()).toEqual([])
    })

    test('Saves the moves as adjustments of the rule and replaces them when generated again', async () => {
      expect(
        await restRuleModel.generate({ companyId, month: '2027-03' })
      ).toEqual({ moved: 2, unmoved: 0 })
      await restRuleModel.generate({ companyId, month: '2027-03' })

      expect(await findAdjustments()).toEqual([
        { date: '2027-03-07', kind: 'work', origin: 'rule' },
        { date: '2027-03-13', kind: 'off', origin: 'rule' },
        { date: '2027-03-24', kind: 'off', origin: 'rule' },
        { date: '2027-03-28', kind: 'work', origin: 'rule' }
      ])
    })

    test('Keeps the manual adjustments, which weigh more than the rule', async () => {
      await shiftAssignmentModel.saveAdjustment({
        companyId,
        userId,
        date: '2027-03-13',
        kind: 'custom',
        entry1: '08:00',
        exit1: '12:00'
      })

      expect(
        await restRuleModel.generate({ companyId, month: '2027-03' })
      ).toEqual({ moved: 1, unmoved: 1 })
      expect(await findAdjustments()).toEqual([
        { date: '2027-03-13', kind: 'custom', origin: 'manual' },
        { date: '2027-03-24', kind: 'off', origin: 'rule' },
        { date: '2027-03-28', kind: 'work', origin: 'rule' }
      ])
    })
  })
})
