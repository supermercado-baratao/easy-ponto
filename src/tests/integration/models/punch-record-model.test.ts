import { beforeAll, describe, expect, test } from 'vitest'

import { companyModel } from '@/models/company/model'
import { punchRecordModel } from '@/models/punch-record/model'
import { mapDeviceUserToUser } from '@/models/synchronization/_utils/user'
import { userModel } from '@/models/user/model'
import { deviceUsers } from '@/tests/_mocks/device-users'
import orchestrator from '@/tests/orchestrator'

let companyId: string
let otherCompanyId: string
let firstPis: string
let secondPis: string

beforeAll(async () => {
  await orchestrator.waitForAllServices()
  await orchestrator.clearDatabase()

  ;[{ id: companyId }, { id: otherCompanyId }] = await Promise.all([
    companyModel.create(orchestrator.createCompanyData()),
    companyModel.create(orchestrator.createCompanyData())
  ])
  const users = mapDeviceUserToUser(deviceUsers.slice(0, 2), companyId)
  await userModel.createMany(users)
  ;[firstPis, secondPis] = users.map(({ pis }) => pis)
  // The same employee in another company, read from that company's device
  await userModel.createMany(
    mapDeviceUserToUser(deviceUsers.slice(0, 1), otherCompanyId)
  )

  await punchRecordModel.createManyNonExistentInAfd([
    {
      companyId,
      pis: firstPis,
      datetime: new Date('2026-03-01T08:00:00.000Z')
    },
    {
      companyId,
      pis: firstPis,
      datetime: new Date('2026-03-01T12:00:00.000Z')
    },
    {
      companyId,
      pis: secondPis,
      datetime: new Date('2026-03-01T08:00:00.000Z')
    },
    {
      companyId: otherCompanyId,
      pis: firstPis,
      datetime: new Date('2026-03-01T08:00:00.000Z')
    }
  ])
})

describe('Punch Record Model', () => {
  describe('createManyNonExistentInAfd', () => {
    test('Saves a record of the same PIS and time in each company', async () => {
      const otherRecords = await punchRecordModel.findMany({
        companyId: otherCompanyId
      })

      expect(
        otherRecords.map(({ companyId, pis, datetime }) => [
          companyId,
          pis,
          datetime
        ])
      ).toEqual([
        [otherCompanyId, firstPis, new Date('2026-03-01T08:00:00.000Z')]
      ])
    })
  })

  describe('createManyExistentsInAfd', () => {
    test('Saves the same NSR in each company', async () => {
      const record = {
        pis: firstPis,
        datetime: new Date('2026-04-01T08:00:00.000Z'),
        afdDatetime: new Date('2026-04-01T08:00:00.000Z'),
        nsr: 1,
        registrationType: '3',
        hexadecimalCheckDigit: 'abcd'
      }

      await punchRecordModel.createManyExistentsInAfd([
        { ...record, companyId },
        { ...record, companyId: otherCompanyId }
      ])

      const [records, otherRecords] = await Promise.all([
        punchRecordModel.findMany({ companyId, initialNsr: 1, finalNsr: 1 }),
        punchRecordModel.findMany({
          companyId: otherCompanyId,
          initialNsr: 1,
          finalNsr: 1
        })
      ])
      expect(records).toHaveLength(1)
      expect(otherRecords).toHaveLength(1)
    })
  })

  describe('findMany', () => {
    test('Lists only the punch records of the company', async () => {
      const punchRecords = await punchRecordModel.findMany({
        companyId,
        finalDate: '2026-03-01'
      })

      expect(punchRecords).toHaveLength(3)
      expect(
        punchRecords.every((record) => record.companyId === companyId)
      ).toBe(true)
    })

    test('Applies the given filters', async () => {
      const punchRecords = await punchRecordModel.findMany({
        companyId,
        pis: secondPis
      })

      expect(punchRecords).toHaveLength(1)
      expect(punchRecords[0].pis).toBe(secondPis)
    })
  })

  describe('findManyByDay', () => {
    test('Lists the records of the employee in each day of the period', async () => {
      await punchRecordModel.createManyNonExistentInAfd([
        {
          companyId,
          pis: firstPis,
          datetime: new Date('2026-02-28T23:59:00.000Z')
        },
        {
          companyId,
          pis: firstPis,
          datetime: new Date('2026-03-03T00:00:00.000Z')
        }
      ])

      const days = await punchRecordModel.findManyByDay({
        companyId,
        pis: firstPis,
        initialDate: '2026-03-01',
        finalDate: '2026-03-02'
      })

      expect(days.map(({ date }) => date)).toEqual(['2026-03-01', '2026-03-02'])
      expect(
        days[0].punchRecords.map(({ pis, datetime }) => [pis, datetime])
      ).toEqual([
        [firstPis, new Date('2026-03-01T08:00:00.000Z')],
        [firstPis, new Date('2026-03-01T12:00:00.000Z')]
      ])
      expect(days[1].punchRecords).toEqual([])
    })
  })
})
