import { describe, expect, test } from 'vitest'

import { journeyRulesSchema, overtimeBandsSchema } from './schema'
import { MAX_OVERTIME_PERCENTAGE, MAX_TOLERANCE } from './utils'

const COMPANY_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'

const RULES = {
  companyId: COMPANY_ID,
  punchTolerance: '5',
  dailyTolerance: '10',
  maxLunch: '02:00',
  maxDailyJourney: '08:00',
  maxContinuousWork: '06:00'
}

const BANDS = {
  'workday-1-percentage': '50',
  'day-off-1-percentage': '100',
  'holiday-1-percentage': '100'
}

const getIssues = (
  result: ReturnType<typeof overtimeBandsSchema.safeParse>
): { path: string; message: string }[] | undefined =>
  result.error?.issues.map(({ path, message }) => ({
    path: path.join('.'),
    message
  }))

const parseBands = (
  data: Record<string, string>
): ReturnType<typeof overtimeBandsSchema.safeParse> =>
  overtimeBandsSchema.safeParse({ companyId: COMPANY_ID, ...BANDS, ...data })

describe('journeyRulesSchema', () => {
  test('Converts the limits to minutes', () => {
    expect(journeyRulesSchema.parse(RULES)).toEqual({
      companyId: COMPANY_ID,
      punchTolerance: 5,
      dailyTolerance: 10,
      maxLunch: 120,
      maxDailyJourney: 480,
      maxContinuousWork: 360
    })
  })

  test('Accepts no tolerance', () => {
    expect(
      journeyRulesSchema.safeParse({
        ...RULES,
        punchTolerance: '0',
        dailyTolerance: '0'
      }).success
    ).toBe(true)
  })

  test.each([
    ['punchTolerance', '-1'],
    ['punchTolerance', String(MAX_TOLERANCE + 1)],
    ['punchTolerance', '2.5'],
    ['maxLunch', '00:00'],
    ['maxLunch', ''],
    ['maxDailyJourney', '8h']
  ])('Refuses %s %j', (field, value) => {
    const result = journeyRulesSchema.safeParse({ ...RULES, [field]: value })
    expect(result.error?.issues.map(({ path }) => path.join('.'))).toEqual([
      field
    ])
  })

  test('Refuses a daily tolerance below the punch tolerance', () => {
    const result = journeyRulesSchema.safeParse({
      ...RULES,
      punchTolerance: '10',
      dailyTolerance: '5'
    })
    expect(result.error?.issues.map(({ path }) => path.join('.'))).toEqual([
      'dailyTolerance'
    ])
  })
})

describe('overtimeBandsSchema', () => {
  test('Leaves the last band of each day kind without a limit', () => {
    expect(
      overtimeBandsSchema.parse({
        companyId: COMPANY_ID,
        ...BANDS,
        'workday-1-upTo': '02:00',
        'workday-2-percentage': '100'
      })
    ).toEqual({
      companyId: COMPANY_ID,
      overtimeBands: [
        { dayKind: 'workday', upTo: 120, percentage: 50 },
        { dayKind: 'workday', upTo: null, percentage: 100 },
        { dayKind: 'day-off', upTo: null, percentage: 100 },
        { dayKind: 'holiday', upTo: null, percentage: 100 }
      ]
    })
  })

  test('Requires a band for each day kind', () => {
    const result = overtimeBandsSchema.safeParse({
      companyId: COMPANY_ID,
      'workday-1-percentage': '50'
    })
    expect(getIssues(result)?.map(({ path }) => path)).toEqual([
      'day-off-1-percentage',
      'holiday-1-percentage'
    ])
  })

  test.each([
    ['', 'Informe o adicional'],
    ['0', 'Informe um adicional maior que zero'],
    [
      String(MAX_OVERTIME_PERCENTAGE + 1),
      `Informe no máximo ${MAX_OVERTIME_PERCENTAGE}%`
    ]
  ])('Refuses the percentage %j', (percentage, message) => {
    expect(
      getIssues(parseBands({ 'workday-1-percentage': percentage }))
    ).toEqual([{ path: 'workday-1-percentage', message }])
  })

  test('Requires the limit of every band but the last', () => {
    expect(getIssues(parseBands({ 'workday-2-percentage': '100' }))).toEqual([
      { path: 'workday-1-upTo', message: 'Informe o limite da faixa' }
    ])
  })

  test('Refuses the bands out of order or overlapping', () => {
    expect(
      getIssues(
        parseBands({
          'workday-1-upTo': '02:00',
          'workday-2-upTo': '01:00',
          'workday-2-percentage': '80',
          'workday-3-percentage': '100'
        })
      )
    ).toEqual([
      {
        path: 'workday-2-upTo',
        message: 'O limite deve ser maior que o da faixa anterior'
      }
    ])
    expect(
      getIssues(
        parseBands({
          'workday-1-upTo': '02:00',
          'workday-2-upTo': '02:00',
          'workday-2-percentage': '80',
          'workday-3-percentage': '100'
        })
      )
    ).toEqual([
      {
        path: 'workday-2-upTo',
        message: 'O limite deve ser maior que o da faixa anterior'
      }
    ])
  })
})
