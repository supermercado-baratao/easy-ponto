import { beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { companyModel } from '@/models/company/model'
import { journeyRulesModel } from '@/models/journey-rules/model'
import { DEFAULT_JOURNEY_RULES } from '@/models/journey-rules/utils'
import orchestrator from '@/tests/orchestrator'

beforeAll(async () => {
  await orchestrator.waitForAllServices()
})

beforeEach(async () => {
  await orchestrator.clearDatabase()
})

const createCompany = async (): Promise<string> => {
  const { id } = await companyModel.create(orchestrator.createCompanyData())
  return id
}

const findRules = async (companyId: string) => {
  const { journeyRules } = await journeyRulesModel.findByCompanyId(companyId)
  return journeyRules
}

describe('Journey Rules Model', () => {
  test('Starts a new company with the CLT rules and without overtime bands', async () => {
    const companyId = await createCompany()

    expect(await journeyRulesModel.findByCompanyId(companyId)).toMatchObject({
      journeyRules: { companyId, ...DEFAULT_JOURNEY_RULES },
      overtimeBands: []
    })
  })

  test('Saves the rules of the given company only', async () => {
    const [companyId, otherId] = await Promise.all([
      createCompany(),
      createCompany()
    ])

    await journeyRulesModel.saveRules({
      companyId,
      punchTolerance: '0',
      dailyTolerance: '15',
      maxLunch: '01:30',
      maxDailyJourney: '10:00',
      maxContinuousWork: '05:00'
    })

    expect(await findRules(companyId)).toMatchObject({
      punchTolerance: 0,
      dailyTolerance: 15,
      maxLunch: 90,
      maxDailyJourney: 600,
      maxContinuousWork: 300
    })
    expect(await findRules(otherId)).toMatchObject(DEFAULT_JOURNEY_RULES)
  })

  test('Replaces the overtime bands, ordered by day kind and limit', async () => {
    const companyId = await createCompany()
    await orchestrator.createOvertimeBands(companyId)

    await journeyRulesModel.saveOvertimeBands({
      companyId,
      'workday-1-upTo': '02:00',
      'workday-1-percentage': '50',
      'workday-2-percentage': '100',
      'day-off-1-percentage': '100',
      'holiday-1-percentage': '150'
    })

    const { overtimeBands } = await journeyRulesModel.findByCompanyId(companyId)
    expect(
      overtimeBands.map(({ dayKind, upTo, percentage }) => ({
        dayKind,
        upTo,
        percentage
      }))
    ).toEqual([
      { dayKind: 'day-off', upTo: null, percentage: 100 },
      { dayKind: 'holiday', upTo: null, percentage: 150 },
      { dayKind: 'workday', upTo: 120, percentage: 50 },
      { dayKind: 'workday', upTo: null, percentage: 100 }
    ])
  })
})
