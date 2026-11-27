import { faker } from '@faker-js/faker'
import { CNPJ } from 'validation-br/cnpj'
import { CPF } from 'validation-br/cpf'
import { beforeAll, describe, expect, test } from 'vitest'
import { z } from 'zod'

import type { ShiftAssignment } from '@/infra/database/types'
import { NotFoundError } from '@/infra/errors'
import { companyModel } from '@/models/company/model'
import { ShiftConflictError } from '@/models/shift-assignment/errors'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { ShiftPatternInUseError } from '@/models/shift-pattern/errors'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const createCompanyWithUser = async (
  deviceUserIndex: number
): Promise<{ companyId: string; userId: string }> => {
  const { id: companyId } = await companyModel.create({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    cpf: CPF.fake().value,
    tipoDoc: 1,
    cpfCnpj: CNPJ.fake().value,
    cei: faker.string.numeric(12),
    registration: faker.string.numeric(12)
  })
  await userModel.createMany(
    mapDeviceUserToUser(
      deviceUsers.slice(deviceUserIndex, deviceUserIndex + 1),
      companyId
    )
  )
  const [{ id: userId }] = await userModel.findManyByCompanyId(companyId)
  return { companyId, userId }
}

const createPattern = async (
  companyId: string,
  name: string,
  times: { cycleLength: string } & Record<string, string>
): Promise<string> => {
  const { id } = await shiftPatternModel.create({
    companyId,
    name,
    startDate: '2026-01-01',
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
let userId: string
let otherCompanyId: string
let otherUserId: string
let twelveByThirtySixId: string
let morningId: string
let afternoonId: string
let otherPatternId: string
let assignment: ShiftAssignment

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  ;({ companyId, userId } = await createCompanyWithUser(0))
  ;({ companyId: otherCompanyId, userId: otherUserId } =
    await createCompanyWithUser(1))
  twelveByThirtySixId = await createPattern(companyId, '12x36', {
    cycleLength: '2',
    day1Entry1: '07:00',
    day1Exit1: '19:00'
  })
  morningId = await createPattern(companyId, 'Manhã', {
    cycleLength: '1',
    day1Entry1: '08:00',
    day1Exit1: '12:00'
  })
  afternoonId = await createPattern(companyId, 'Tarde', {
    cycleLength: '1',
    day1Entry1: '11:00',
    day1Exit1: '17:00'
  })
  otherPatternId = await createPattern(otherCompanyId, '12x36', {
    cycleLength: '2',
    day1Entry1: '07:00',
    day1Exit1: '19:00'
  })
})

describe('Shift Assignment Model', () => {
  test('Links the employee to a pattern from a day of the cycle', async () => {
    assignment = await shiftAssignmentModel.create({
      companyId,
      userId,
      shiftPatternId: twelveByThirtySixId,
      startDate: '2026-11-02',
      endDate: '',
      cycleStartDay: '2'
    })

    expect(assignment).toMatchObject({
      userId,
      shiftPatternId: twelveByThirtySixId,
      startDate: '2026-11-02',
      endDate: null,
      cycleStartDay: 2
    })
    const days = await shiftAssignmentModel.findUserDays({
      userId,
      companyId,
      initialDate: '2026-11-01',
      finalDate: '2026-11-04'
    })
    expect(days.map(({ kind }) => kind)).toEqual([
      'unassigned',
      'off',
      'work',
      'off'
    ])
  })

  test('Refuses a cycle day past the cycle of the pattern', async () => {
    expect(
      await getFieldErrors(
        shiftAssignmentModel.create({
          companyId,
          userId,
          shiftPatternId: morningId,
          startDate: '2027-01-01',
          cycleStartDay: '2'
        })
      )
    ).toEqual([
      { path: 'cycleStartDay', message: 'O ciclo da escala tem 1 dia' }
    ])
  })

  test('Refuses an end before the start', async () => {
    expect(
      await getFieldErrors(
        shiftAssignmentModel.create({
          companyId,
          userId,
          shiftPatternId: morningId,
          startDate: '2027-01-02',
          endDate: '2027-01-01',
          cycleStartDay: '1'
        })
      )
    ).toEqual([{ path: 'endDate', message: 'O fim deve ser depois do início' }])
  })

  test('Refuses a pattern whose times overlap another one in effect', async () => {
    await expect(
      shiftAssignmentModel.create({
        companyId,
        userId,
        shiftPatternId: morningId,
        startDate: '2026-11-01',
        cycleStartDay: '1'
      })
    ).rejects.toBeInstanceOf(ShiftConflictError)
  })

  test('Keeps the ended link in the history when the employee changes pattern', async () => {
    assignment = await shiftAssignmentModel.update({
      id: assignment.id,
      companyId,
      userId,
      shiftPatternId: twelveByThirtySixId,
      startDate: '2026-11-02',
      endDate: '2026-11-30',
      cycleStartDay: '2'
    })
    await shiftAssignmentModel.create({
      companyId,
      userId,
      shiftPatternId: morningId,
      startDate: '2026-12-01',
      cycleStartDay: '1'
    })

    const assignments = await shiftAssignmentModel.findManyByUserId({
      userId,
      companyId
    })
    expect(
      assignments.map(({ shiftPattern, startDate, endDate }) => [
        shiftPattern.name,
        startDate,
        endDate
      ])
    ).toEqual([
      ['Manhã', '2026-12-01', null],
      ['12x36', '2026-11-02', '2026-11-30']
    ])
  })

  test('Adds up two patterns in effect together and refuses one that overlaps', async () => {
    await expect(
      shiftAssignmentModel.create({
        companyId,
        userId,
        shiftPatternId: afternoonId,
        startDate: '2026-12-01',
        cycleStartDay: '1'
      })
    ).rejects.toBeInstanceOf(ShiftConflictError)

    const evening = await createPattern(companyId, 'Noite', {
      cycleLength: '1',
      day1Entry1: '18:00',
      day1Exit1: '22:00'
    })
    await shiftAssignmentModel.create({
      companyId,
      userId,
      shiftPatternId: evening,
      startDate: '2026-12-01',
      cycleStartDay: '1'
    })

    const [day] = await shiftAssignmentModel.findUserDays({
      userId,
      companyId,
      initialDate: '2026-12-02',
      finalDate: '2026-12-02'
    })
    expect(day.pairs).toEqual([
      { entry: 480, exit: 720 },
      { entry: 1080, exit: 1320 }
    ])
  })

  test('Saves the adjustments of a day over the patterns', async () => {
    const [morning] = await shiftAssignmentModel.findManyByUserId({
      userId,
      companyId
    })
    await shiftAssignmentModel.saveAdjustment({
      companyId,
      userId,
      date: '2026-11-03',
      kind: 'off'
    })
    await shiftAssignmentModel.saveAdjustment({
      companyId,
      userId,
      date: '2026-11-04',
      kind: 'work',
      shiftAssignmentId: assignment.id
    })
    const custom = await shiftAssignmentModel.saveAdjustment({
      companyId,
      userId,
      date: '2026-12-03',
      kind: 'custom',
      entry1: '10:00',
      exit1: '14:00'
    })

    const adjustedDays = await shiftAssignmentModel.findUserDays({
      userId,
      companyId,
      initialDate: '2026-11-03',
      finalDate: '2026-11-04'
    })
    expect(adjustedDays.map(({ kind, pairs }) => [kind, pairs])).toEqual([
      ['off', []],
      ['work', [{ entry: 420, exit: 1140 }]]
    ])
    expect(
      await getFieldErrors(
        shiftAssignmentModel.saveAdjustment({
          companyId,
          userId,
          date: '2026-11-05',
          kind: 'work',
          shiftAssignmentId: morning.id
        })
      )
    ).toEqual([
      {
        path: 'shiftAssignmentId',
        message: 'A escala não está em vigor nesse dia'
      }
    ])

    await shiftAssignmentModel.removeAdjustment({ id: custom.id, companyId })
    const [restored] = await shiftAssignmentModel.findUserDays({
      userId,
      companyId,
      initialDate: '2026-12-03',
      finalDate: '2026-12-03'
    })
    expect(restored.adjusted).toBe(false)
  })

  test('Replaces the adjustment saved for the same day', async () => {
    await shiftAssignmentModel.saveAdjustment({
      companyId,
      userId,
      date: '2026-11-03',
      kind: 'custom',
      entry1: '09:00',
      exit1: '13:00'
    })

    const adjustments = await shiftAssignmentModel.findAdjustmentsByUserId({
      userId,
      companyId
    })
    expect(
      adjustments.filter(({ date }) => date === '2026-11-03')
    ).toMatchObject([
      { kind: 'custom', origin: 'manual', entry1: 540, exit1: 780 }
    ])
  })

  test('Refuses the employees, patterns and links of another company', async () => {
    await expect(
      shiftAssignmentModel.create({
        companyId,
        userId: otherUserId,
        shiftPatternId: twelveByThirtySixId,
        startDate: '2027-01-01',
        cycleStartDay: '1'
      })
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      shiftAssignmentModel.create({
        companyId,
        userId,
        shiftPatternId: otherPatternId,
        startDate: '2027-01-01',
        cycleStartDay: '1'
      })
    ).rejects.toBeInstanceOf(NotFoundError)
    await expect(
      shiftAssignmentModel.remove({
        id: assignment.id,
        companyId: otherCompanyId
      })
    ).rejects.toBeInstanceOf(NotFoundError)
  })

  test('Refuses to remove a pattern linked to an employee', async () => {
    await expect(
      shiftPatternModel.remove({ id: twelveByThirtySixId, companyId })
    ).rejects.toBeInstanceOf(ShiftPatternInUseError)
  })

  test('Removes a link and the adjustments that follow it', async () => {
    await shiftAssignmentModel.remove({ id: assignment.id, companyId })

    const assignments = await shiftAssignmentModel.findManyByUserId({
      userId,
      companyId
    })
    expect(assignments.map(({ id }) => id)).not.toContain(assignment.id)
    const adjustments = await shiftAssignmentModel.findAdjustmentsByUserId({
      userId,
      companyId
    })
    expect(adjustments.map(({ date }) => date)).not.toContain('2026-11-04')
    await shiftPatternModel.remove({ id: twelveByThirtySixId, companyId })
  })
})
