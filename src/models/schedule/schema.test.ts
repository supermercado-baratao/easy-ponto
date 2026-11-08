import { describe, expect, test } from 'vitest'

import { saveSchema } from './schema'

const COMPANY_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'
const USER_ID = '6f1f4b7e-3c2a-4d5b-9e8f-1a2b3c4d5e6f'

const parse = (
  times: Record<string, string>
): ReturnType<typeof saveSchema.safeParse> =>
  saveSchema.safeParse({
    companyId: COMPANY_ID,
    userId: USER_ID,
    startDate: '2026-01-01',
    ...times
  })

const getIssues = (
  times: Record<string, string>
): { path: string; message: string }[] | undefined =>
  parse(times).error?.issues.map(({ path, message }) => ({
    path: path.join('.'),
    message
  }))

describe('saveSchema', () => {
  test('Converts the times to minutes and leaves the days off empty', () => {
    const result = parse({
      mondayEntry1: '07:00',
      mondayExit1: '11:00',
      mondayEntry2: '13:00',
      mondayExit2: '16:20'
    })

    expect(result.data?.days).toHaveLength(7)
    expect(result.data?.days[0]).toEqual({
      weekday: 1,
      entry1: 420,
      exit1: 660,
      entry2: 780,
      exit2: 980,
      entry3: null,
      exit3: null
    })
    expect(result.data?.days[6]).toEqual({
      weekday: 0,
      entry1: null,
      exit1: null,
      entry2: null,
      exit2: null,
      entry3: null,
      exit3: null
    })
  })

  test('Rejects a time out of the hh:mm format', () => {
    expect(getIssues({ mondayEntry1: '7:00', mondayExit1: '24:00' })).toEqual([
      { path: 'mondayEntry1', message: 'Horário deve estar no formato hh:mm' },
      { path: 'mondayExit1', message: 'Horário deve estar no formato hh:mm' }
    ])
  })

  test('Requires both times of a pair', () => {
    expect(getIssues({ mondayEntry1: '07:00' })).toEqual([
      { path: 'mondayExit1', message: 'Informe a saída' }
    ])
    expect(getIssues({ tuesdayExit1: '11:00' })).toEqual([
      { path: 'tuesdayEntry1', message: 'Informe a entrada' }
    ])
  })

  test('Requires the previous pair before the next one', () => {
    expect(getIssues({ fridayEntry2: '13:00', fridayExit2: '17:00' })).toEqual([
      {
        path: 'fridayEntry2',
        message: 'Preencha os horários anteriores primeiro'
      }
    ])
  })

  test('Requires each time to be after the previous one', () => {
    expect(getIssues({ mondayEntry1: '11:00', mondayExit1: '07:00' })).toEqual([
      { path: 'mondayExit1', message: 'Horário deve ser depois do anterior' }
    ])
    expect(
      getIssues({
        sundayEntry1: '07:00',
        sundayExit1: '11:00',
        sundayEntry2: '11:00',
        sundayExit2: '15:00'
      })
    ).toEqual([
      { path: 'sundayEntry2', message: 'Horário deve ser depois do anterior' }
    ])
  })

  test('Reports each day on its own', () => {
    expect(
      getIssues({ mondayEntry1: '07:00', saturdayExit1: '11:00' })
    ).toEqual([
      { path: 'mondayExit1', message: 'Informe a saída' },
      { path: 'saturdayEntry1', message: 'Informe a entrada' }
    ])
  })
})
