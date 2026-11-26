import { describe, expect, test } from 'vitest'

import { createSchema, updateSchema } from './schema'

const COMPANY_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
const SHIFT_PATTERN_ID = '6f1f4b7e-3c2a-4d5b-9e8f-1a2b3c4d5e6f'

const DAY_TIMES = {
  day1Entry1: '08:00',
  day1Exit1: '12:00',
  day1Entry2: '13:00',
  day1Exit2: '16:20'
}

const parse = (
  data: Record<string, string>
): ReturnType<typeof createSchema.safeParse> =>
  createSchema.safeParse({
    companyId: COMPANY_ID,
    name: '6x1',
    startDate: '2026-01-01',
    cycleLength: '7',
    ...data
  })

const getIssues = (
  data: Record<string, string>
): { path: string; message: string }[] | undefined =>
  parse(data).error?.issues.map(({ path, message }) => ({
    path: path.join('.'),
    message
  }))

describe('createSchema', () => {
  test('Converts the times to minutes and leaves the days off empty', () => {
    const result = parse(DAY_TIMES)

    expect(result.data?.version.cycleLength).toBe(7)
    expect(result.data?.version.days).toHaveLength(7)
    expect(result.data?.version.days[0]).toEqual({
      cycleDay: 1,
      entry1: 480,
      exit1: 720,
      entry2: 780,
      exit2: 980,
      entry3: null,
      exit3: null
    })
    expect(result.data?.version.days[6]).toEqual({
      cycleDay: 7,
      entry1: null,
      exit1: null,
      entry2: null,
      exit2: null,
      entry3: null,
      exit3: null
    })
  })

  test('Ignores the days past the end of the cycle', () => {
    const result = parse({
      cycleLength: '2',
      ...DAY_TIMES,
      day3Entry1: '08:00'
    })

    expect(result.data?.version.days.map(({ cycleDay }) => cycleDay)).toEqual([
      1, 2
    ])
  })

  test('Limits the cycle from 1 to 35 days', () => {
    expect(getIssues({ ...DAY_TIMES, cycleLength: '0' })).toEqual([
      { path: 'cycleLength', message: 'O ciclo deve ter pelo menos 1 dia' }
    ])
    expect(getIssues({ ...DAY_TIMES, cycleLength: '36' })).toEqual([
      { path: 'cycleLength', message: 'O ciclo deve ter no máximo 35 dias' }
    ])
    expect(getIssues({ ...DAY_TIMES, cycleLength: '1.5' })).toEqual([
      { path: 'cycleLength', message: 'Informe um número inteiro de dias' }
    ])
    expect(parse({ ...DAY_TIMES, cycleLength: '35' }).success).toBe(true)
  })

  test('Requires a name and a start date', () => {
    expect(getIssues({ ...DAY_TIMES, name: ' ', startDate: '' })).toEqual([
      { path: 'name', message: 'Informe o nome' },
      { path: 'startDate', message: 'Informe a data' }
    ])
  })

  test('Requires at least one workday', () => {
    expect(getIssues({})).toEqual([
      {
        path: 'day1Entry1',
        message: 'Informe os horários de pelo menos um dia de trabalho'
      }
    ])
  })

  test('Requires both times of a pair and the previous pair first', () => {
    expect(getIssues({ ...DAY_TIMES, day2Entry1: '07:00' })).toEqual([
      { path: 'day2Exit1', message: 'Informe a saída' }
    ])
    expect(
      getIssues({ ...DAY_TIMES, day3Entry2: '13:00', day3Exit2: '17:00' })
    ).toEqual([
      {
        path: 'day3Entry2',
        message: 'Preencha os horários anteriores primeiro'
      }
    ])
  })

  test('Reads a time before the previous one as past midnight', () => {
    const result = parse({
      cycleLength: '2',
      day1Entry1: '19:00',
      day1Exit1: '23:00',
      day1Entry2: '00:00',
      day1Exit2: '07:00'
    })

    expect(result.data?.version.days[0]).toMatchObject({
      entry1: 1140,
      exit1: 1380,
      entry2: 1440,
      exit2: 1860
    })
  })

  test('Crosses midnight only once a day and keeps the day under 24 hours', () => {
    expect(
      getIssues({
        day1Entry1: '19:00',
        day1Exit1: '02:00',
        day1Entry2: '01:00',
        day1Exit2: '03:00'
      })
    ).toEqual([
      { path: 'day1Entry2', message: 'Horário deve ser depois do anterior' }
    ])
    expect(
      getIssues({
        day1Entry1: '08:00',
        day1Exit1: '12:00',
        day1Entry2: '13:00',
        day1Exit2: '08:00'
      })
    ).toEqual([
      {
        path: 'day1Exit2',
        message: 'A jornada do dia deve durar menos de 24 horas'
      }
    ])
    expect(
      getIssues({ ...DAY_TIMES, day1Entry2: '12:00', day1Exit2: '16:00' })
    ).toEqual([
      { path: 'day1Entry2', message: 'Horário deve ser depois do anterior' }
    ])
  })

  test('Requires the next day to start after a night shift ends', () => {
    expect(
      getIssues({
        cycleLength: '2',
        day1Entry1: '19:00',
        day1Exit1: '07:00',
        day2Entry1: '06:00',
        day2Exit1: '12:00'
      })
    ).toEqual([
      {
        path: 'day2Entry1',
        message: 'A entrada deve ser depois da última saída do dia anterior'
      }
    ])
    expect(
      getIssues({
        cycleLength: '2',
        day1Entry1: '19:00',
        day1Exit1: '07:00',
        day2Entry1: '07:00',
        day2Exit1: '12:00'
      })
    ).toBeUndefined()
  })

  test('Wraps the night shift of the last day into the first one', () => {
    expect(
      getIssues({
        cycleLength: '2',
        day1Entry1: '06:00',
        day1Exit1: '12:00',
        day2Entry1: '19:00',
        day2Exit1: '07:00'
      })
    ).toEqual([
      {
        path: 'day1Entry1',
        message: 'A entrada deve ser depois da última saída do dia anterior'
      }
    ])
  })
})

describe('updateSchema', () => {
  test('Keeps the version id, or leaves it out for a new version', () => {
    const data = {
      id: SHIFT_PATTERN_ID,
      companyId: COMPANY_ID,
      name: '6x1',
      startDate: '2026-01-01',
      cycleLength: '7',
      ...DAY_TIMES
    }

    expect(
      updateSchema.parse({ ...data, versionId: SHIFT_PATTERN_ID }).version.id
    ).toBe(SHIFT_PATTERN_ID)
    expect(updateSchema.parse(data).version.id).toBeUndefined()
  })
})
