import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import { dayjs, wallClockNow } from '@/infra/dayjs'
import { companyModel } from '@/models/company/model'
import { RestRestrictionNotFoundError } from '@/models/rest-restriction/errors'
import { restRestrictionModel } from '@/models/rest-restriction/model'
import { restRuleModel } from '@/models/rest-rule/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { UserGroupInRestrictionError } from '@/models/user-group/errors'
import { userGroupModel } from '@/models/user-group/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const DATE_FORMAT = 'YYYY-MM-DD'

const byId = (a: string, b: string): number => a.localeCompare(b)

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
let userIds: string[]
let otherUserId: string
let assignmentIds: string[]
let groupId: string
// The links start on a Monday before today, so the warnings fall in the days ahead whatever the date
const linkStart = dayjs(wallClockNow().format(DATE_FORMAT))
  .subtract(7, 'day')
  .day(1)
  .format(DATE_FORMAT)

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  companyId = await createCompany()
  otherCompanyId = await createCompany()
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 3), companyId)
  )
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(3, 4), otherCompanyId)
  )
  const users = await userModel.findManyByCompanyId(companyId)
  userIds = users.map(({ id }) => id)
  const otherUsers = await userModel.findManyByCompanyId(otherCompanyId)
  otherUserId = otherUsers[0].id
  // Monday to Saturday from 08:00 to 16:00, with Sunday off
  const { id: patternId } = await shiftPatternModel.create({
    companyId,
    name: '6x1',
    startDate: '2026-01-05',
    cycleLength: '7',
    ...Object.fromEntries(
      [1, 2, 3, 4, 5, 6].flatMap((day) => [
        [`day${day}Entry1`, '08:00'],
        [`day${day}Exit1`, '16:00']
      ])
    )
  })
  assignmentIds = []
  for (const userId of userIds) {
    const { id } = await shiftAssignmentModel.create({
      companyId,
      userId,
      shiftPatternId: patternId,
      startDate: linkStart,
      cycleStartDay: '1'
    })
    assignmentIds.push(id)
  }
  ;({ id: groupId } = await userGroupModel.create({ companyId, name: 'Caixa' }))
})

describe('Rest Restriction Model', () => {
  test('Saves only the fields of the kind of the restriction', async () => {
    const restriction = await restRestrictionModel.create({
      companyId,
      kind: 'together',
      level: 'required',
      maxOff: '1',
      userIds: [userIds[0], userIds[1]],
      userGroupId: groupId,
      weekdays: ['1']
    })

    const [saved] = await restRestrictionModel.findManyByCompanyId(companyId)
    expect(saved).toMatchObject({
      id: restriction.id,
      kind: 'together',
      maxOff: 1,
      userGroupId: null,
      weekdays: []
    })
    expect(saved.users.map(({ userId }) => userId).toSorted(byId)).toEqual(
      [userIds[0], userIds[1]].toSorted(byId)
    )

    await restRestrictionModel.update({
      id: restriction.id,
      companyId,
      kind: 'weekdays',
      level: 'preferred',
      maxOff: '1',
      userId: userIds[0],
      userIds: [userIds[0], userIds[1]],
      weekdays: ['6', '1', '6']
    })
    const [updated] = await restRestrictionModel.findManyByCompanyId(companyId)
    expect(updated).toMatchObject({
      kind: 'weekdays',
      level: 'preferred',
      maxOff: null,
      userId: userIds[0],
      weekdays: [1, 6],
      users: []
    })

    await restRestrictionModel.remove({ id: restriction.id, companyId })
  })

  test('Refuses a restriction without the fields of its kind', async () => {
    expect(
      await getFieldErrors(
        restRestrictionModel.create({
          companyId,
          kind: 'together',
          level: 'required',
          maxOff: '2',
          userIds: [userIds[0], userIds[1]]
        })
      )
    ).toEqual([
      {
        path: 'maxOff',
        message: 'Informe um máximo menor que o número de funcionários'
      }
    ])
    expect(
      await getFieldErrors(
        restRestrictionModel.create({
          companyId,
          kind: 'weekdays',
          level: 'required',
          userId: userIds[0],
          weekdays: ['0', '1', '2', '3', '4', '5', '6']
        })
      )
    ).toEqual([
      { path: 'weekdays', message: 'Deixe ao menos um dia da semana livre' }
    ])
  })

  test('Refuses the employees and the groups of another company', async () => {
    expect(
      await getFieldErrors(
        restRestrictionModel.create({
          companyId,
          kind: 'together',
          level: 'required',
          maxOff: '1',
          userIds: [userIds[0], otherUserId]
        })
      )
    ).toEqual([
      { path: 'userIds', message: 'Um dos funcionários não foi encontrado' }
    ])
    expect(
      await getFieldErrors(
        restRestrictionModel.create({
          companyId: otherCompanyId,
          kind: 'group',
          level: 'required',
          maxOff: '1',
          userGroupId: groupId
        })
      )
    ).toEqual([{ path: 'userGroupId', message: 'O grupo não foi encontrado' }])
  })

  test('Keeps one limit per group and keeps the group while it has one', async () => {
    const limit = await restRestrictionModel.create({
      companyId,
      kind: 'group',
      level: 'required',
      maxOff: '1',
      userGroupId: groupId
    })

    expect(
      await getFieldErrors(
        restRestrictionModel.create({
          companyId,
          kind: 'group',
          level: 'preferred',
          maxOff: '2',
          userGroupId: groupId
        })
      )
    ).toEqual([
      { path: 'userGroupId', message: 'O grupo Caixa já tem um limite' }
    ])
    await expect(
      userGroupModel.remove({ id: groupId, companyId })
    ).rejects.toThrow(UserGroupInRestrictionError)

    await expect(
      restRestrictionModel.remove({ id: limit.id, companyId: otherCompanyId })
    ).rejects.toThrow(RestRestrictionNotFoundError)
    await restRestrictionModel.remove({ id: limit.id, companyId })
  })

  test('Warns the links whose days off of the schedule break a restriction', async () => {
    const restriction = await restRestrictionModel.create({
      companyId,
      kind: 'together',
      level: 'required',
      maxOff: '1',
      userIds: [userIds[0], userIds[1]]
    })
    const nextSunday = dayjs(wallClockNow().format(DATE_FORMAT))
      .add(1, 'day')
      .day(7)
      .format(DATE_FORMAT)
    const adjustment = await shiftAssignmentModel.saveAdjustment({
      companyId,
      userId: userIds[1],
      date: nextSunday,
      kind: 'work',
      shiftAssignmentId: assignmentIds[1]
    })

    const breaks = await restRestrictionModel.findAssignmentBreaks(companyId)

    const firstDates = breaks[assignmentIds[0]].map(({ date }) => date)
    const secondDates = breaks[assignmentIds[1]].map(({ date }) => date)
    expect(firstDates.length).toBeGreaterThan(0)
    expect(
      firstDates.every((date) => dayjs(date).day() === 0 && date !== nextSunday)
    ).toBe(true)
    expect(secondDates).toEqual(firstDates)
    expect(breaks[assignmentIds[0]][0].restriction).toMatchObject({
      id: restriction.id,
      kind: 'together'
    })
    expect(breaks[assignmentIds[2]]).toBeUndefined()

    await shiftAssignmentModel.removeAdjustment({
      id: adjustment.id,
      companyId
    })
    await restRestrictionModel.remove({ id: restriction.id, companyId })
  })

  test('Moves the days off of a month apart for the employees that rest apart', async () => {
    const patterns = await shiftPatternModel.findManyByCompanyId(companyId)
    const rule = await restRuleModel.create({
      companyId,
      name: 'Folga na janela',
      shiftPatternIds: patterns.map(({ id }) => id),
      windowStartDay: '10',
      windowEndDay: '25',
      distances: '2, 4, 6, 1',
      holidayRest: 'window'
    })
    const restriction = await restRestrictionModel.create({
      companyId,
      kind: 'together',
      level: 'required',
      maxOff: '1',
      userIds: [userIds[0], userIds[1]]
    })

    const { moves } = await restRuleModel.preview({
      companyId,
      month: '2027-03'
    })
    const targets = moves
      .filter(({ date }) => date === '2027-03-07')
      .map(({ userId, target }) => ({ userId, target }))

    expect(
      targets.find(({ userId }) => userId === userIds[0])?.target
    ).not.toBe(targets.find(({ userId }) => userId === userIds[1])?.target)

    await restRestrictionModel.remove({ id: restriction.id, companyId })
    await restRuleModel.remove({ id: rule.id, companyId })
  })
})
