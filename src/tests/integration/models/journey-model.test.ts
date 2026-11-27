import { beforeAll, describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'
import { companyModel } from '@/models/company/model'
import { journeyModel } from '@/models/journey/model'
import { journeyRulesModel } from '@/models/journey-rules/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

const MONDAY = '2026-03-02'
const TUESDAY = '2026-03-03'
const WEDNESDAY = '2026-03-04'

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

  await orchestrator.createOvertimeBands(companyId)
  await orchestrator.assignShift({
    companyId,
    userId: employee.id,
    startDate: MONDAY,
    days: [['08:00', '12:00'], []]
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
    test("Calculates each day of the period from the employee's own punches and shift", async () => {
      const { days, overtimePercentages } = await journeyModel.findUserDays({
        companyId,
        user: employee,
        initialDate: MONDAY,
        finalDate: TUESDAY
      })

      expect(overtimePercentages).toEqual([50, 100])
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

    test('Follows the tolerances and the overtime bands of the company', async () => {
      await journeyRulesModel.saveRules({
        companyId,
        punchTolerance: '0',
        dailyTolerance: '0',
        maxLunch: '02:00',
        maxDailyJourney: '08:00',
        maxContinuousWork: '06:00'
      })
      await punchRecordModel.createManyNonExistentInAfd(
        [
          `${TUESDAY}T08:00`,
          `${TUESDAY}T12:00`,
          `${WEDNESDAY}T08:03`,
          `${WEDNESDAY}T12:00`
        ].map((datetime) => ({
          companyId,
          pis: employee.pis,
          datetime: new Date(`${datetime}:00.000Z`)
        }))
      )

      const { days } = await journeyModel.findUserDays({
        companyId,
        user: employee,
        initialDate: TUESDAY,
        finalDate: WEDNESDAY
      })

      expect(days[0].journey).toMatchObject({
        kind: 'day-off',
        overtime: [{ percentage: 100, minutes: 240 }]
      })
      expect(days[1].journey).toMatchObject({ kind: 'workday', lateness: 3 })
    })
  })
})
