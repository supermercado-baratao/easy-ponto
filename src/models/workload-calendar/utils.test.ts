import { describe, expect, test } from 'vitest'

import { buildMonthCalendar } from './utils'

const NOVEMBER_HOLIDAYS = [
  { dateInYear: '2026-11-02', name: 'Finados' },
  { dateInYear: '2026-11-15', name: 'Proclamação da República' },
  { dateInYear: '2026-11-20', name: 'Consciência Negra' }
]

describe('buildMonthCalendar', () => {
  test('Sums 8:00 at the start and end of the month and 7:20 in the middle', () => {
    const calendar = buildMonthCalendar({ month: '2026-11', holidays: [] })
    const days = calendar.weeks.flatMap(({ days }) => days)

    expect(days.find((day) => day?.day === 10)?.workload).toBe(480)
    expect(days.find((day) => day?.day === 11)?.workload).toBe(440)
    expect(days.find((day) => day?.day === 26)?.workload).toBe(440)
    expect(days.find((day) => day?.day === 27)?.workload).toBe(480)
    expect(calendar).toMatchObject({
      workedDays: 25,
      total: 11 * 480 + 14 * 440,
      standardJourney: 25 * 440,
      excess: 11 * 40
    })
  })

  test('Leaves Sundays and holidays without workload and out of the worked days', () => {
    const calendar = buildMonthCalendar({
      month: '2026-11',
      holidays: NOVEMBER_HOLIDAYS
    })
    const days = calendar.weeks.flatMap(({ days }) => days)

    expect(days.find((day) => day?.day === 1)).toMatchObject({
      isSunday: true,
      holidayName: null,
      workload: 0
    })
    expect(days.find((day) => day?.day === 20)).toMatchObject({
      isSunday: false,
      holidayName: 'Consciência Negra',
      workload: 0
    })
    expect(calendar).toMatchObject({
      workedDays: 23,
      total: 10 * 480 + 13 * 440,
      standardJourney: 23 * 440,
      excess: 10 * 40
    })
  })

  test('Sums each week from Sunday to Saturday', () => {
    const calendar = buildMonthCalendar({
      month: '2026-11',
      holidays: NOVEMBER_HOLIDAYS
    })

    expect(calendar.weeks.map(({ total }) => total)).toEqual([
      5 * 480,
      2 * 480 + 4 * 440,
      5 * 440,
      4 * 440 + 2 * 480,
      480
    ])
  })

  test('Leaves the days of the first and last weeks outside the month empty', () => {
    const calendar = buildMonthCalendar({ month: '2035-08', holidays: [] })
    const first = calendar.weeks[0].days
    const last = calendar.weeks.at(-1)!.days

    expect(first.slice(0, 3)).toEqual([null, null, null])
    expect(first[3]?.date).toBe('2035-08-01')
    expect(last.map((day) => day?.day ?? null)).toEqual([
      26,
      27,
      28,
      29,
      30,
      31,
      null
    ])
  })
})
