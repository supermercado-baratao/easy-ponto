import { beforeAll, describe, expect, test } from 'vitest'

import { companyModel } from '@/models/company/model'
import { restRuleModel } from '@/models/rest-rule/model'
import { scheduleReportModel } from '@/models/schedule-report/model'
import { shiftAssignmentModel } from '@/models/shift-assignment/model'
import { shiftPatternModel } from '@/models/shift-pattern/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { userGroupModel } from '@/models/user-group/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

let companyId: string
let names: string[]

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()
  ;({ id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  ))
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 3), companyId)
  )
  const users = await userModel.findManyByCompanyId(companyId)
  names = users.map(({ name }) => name)
  const { id: shiftPatternId } = await shiftPatternModel.create({
    companyId,
    name: '6x1',
    startDate: '2027-01-01',
    cycleLength: '7',
    ...Object.fromEntries(
      [1, 2, 3, 4, 5, 6].flatMap((day) => [
        [`day${day}Entry1`, '08:00'],
        [`day${day}Exit1`, '16:00']
      ])
    )
  })
  const { id: groupId } = await userGroupModel.create({
    companyId,
    name: 'Padaria',
    parentId: ''
  })
  // The cycle starts on Monday, March 1, 2027, so the days off are the Sundays
  for (const user of users.slice(0, 2)) {
    await shiftAssignmentModel.create({
      companyId,
      userId: user.id,
      shiftPatternId,
      startDate: '2027-03-01',
      endDate: '',
      cycleStartDay: '1'
    })
  }
  await userModel.update({
    id: users[0].id,
    companyId,
    status: 'registered',
    groupIds: [groupId]
  })
  await userModel.update({
    id: users[1].id,
    companyId,
    status: 'dismissed'
  })
  await restRuleModel.create({
    companyId,
    name: 'Folga na janela',
    shiftPatternIds: [shiftPatternId],
    windowStartDay: '5',
    windowEndDay: '25',
    distances: '2, 4, 6, 1',
    holidayRest: 'window'
  })
})

describe('scheduleReportModel.resolvePeriod', () => {
  test('Keeps the final month between the initial one and a year after it', () => {
    expect(
      scheduleReportModel.resolvePeriod({
        initialMonth: '2027-03',
        finalMonth: '2027-01',
        limit: '3'
      })
    ).toEqual({ initialMonth: '2027-03', finalMonth: '2027-03', limit: 3 })
    expect(
      scheduleReportModel.resolvePeriod({
        initialMonth: '2027-03',
        finalMonth: '2029-01',
        limit: 'abc'
      })
    ).toEqual({ initialMonth: '2027-03', finalMonth: '2028-02', limit: null })
  })
})

describe('scheduleReportModel.findReport', () => {
  test('Reports the active employees with their groups and patterns, and the months the rests were not generated for', async () => {
    const { report, rules } = await scheduleReportModel.findReport({
      companyId,
      initialMonth: '2027-02',
      finalMonth: '2027-03',
      limit: null
    })

    expect(rules.map(({ name }) => name)).toEqual(['Folga na janela'])
    expect(report.employees).toEqual([
      expect.objectContaining({
        name: names[0],
        groupNames: ['Padaria'],
        shiftPatternNames: ['6x1'],
        movedRests: 1
      })
    ])
    expect(report.months.map(({ month }) => month)).toEqual([
      '2027-02',
      '2027-03'
    ])
    expect(report.attentionPoints).toEqual(
      expect.arrayContaining([
        { kind: 'outdated-month', month: '2027-03' },
        { kind: 'single-member-group', groupName: 'Padaria' },
        { kind: 'without-schedule', userName: names[2] }
      ])
    )
    expect(report.attentionPoints).not.toContainEqual({
      kind: 'outdated-month',
      month: '2027-02'
    })
  })

  test('Is up to date once the rests of the month are generated', async () => {
    await restRuleModel.generate({ companyId, month: '2027-03' })

    const { report } = await scheduleReportModel.findReport({
      companyId,
      initialMonth: '2027-03',
      finalMonth: '2027-03',
      limit: null
    })

    expect(report.months[0].upToDate).toBe(true)
  })
})
