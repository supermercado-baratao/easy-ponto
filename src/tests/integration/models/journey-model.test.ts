import { beforeAll, describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'
import { companyModel } from '@/models/company/model'
import { journeyModel } from '@/models/journey/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { scheduleModel } from '@/models/schedule/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const MONDAY = '2026-03-02'
const TUESDAY = '2026-03-03'

let companyId: string
let employee: User

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()

  ;({ id: companyId } = await companyModel.create(
    orchestrator.createCompanyData()
  ))
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 2), companyId)
  )
  const [first, second] = await userModel.findManyByCompanyId(companyId)
  employee = first

  await scheduleModel.save({
    companyId,
    userId: employee.id,
    startDate: '2026-01-01',
    mondayEntry1: '08:00',
    mondayExit1: '12:00'
  })
  await punchRecordModel.createManyNonExistentInAfd([
    {
      companyId,
      pis: employee.pis,
      datetime: new Date(`${MONDAY}T08:00:00.000Z`)
    },
    {
      companyId,
      pis: employee.pis,
      datetime: new Date(`${MONDAY}T12:00:00.000Z`)
    },
    {
      companyId,
      pis: second.pis,
      datetime: new Date(`${MONDAY}T09:00:00.000Z`)
    }
  ])
})

describe('Journey Model', () => {
  describe('findUserDays', () => {
    test("Calculates each day of the period from the employee's own punches and schedule", async () => {
      const { days, schedules } = await journeyModel.findUserDays({
        companyId,
        user: employee,
        initialDate: MONDAY,
        finalDate: TUESDAY
      })

      expect(schedules).toHaveLength(1)
      expect(days.map(({ date }) => date)).toEqual([MONDAY, TUESDAY])
      expect(days[0].punchRecords).toHaveLength(2)
      expect(
        days[0].punchRecords.every(({ pis }) => pis === employee.pis)
      ).toBe(true)
      expect(days[0].journey).toMatchObject({
        kind: 'workday',
        expected: 240,
        worked: 240
      })
      expect(days[1].journey.kind).toBe('day-off')
    })
  })
})
