// @vitest-environment node

import { describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'
import {
  createDayRow,
  createEmployee,
  createReportFile,
  createReportRows,
  REPORT_COLUMNS,
  type TRow
} from '@/tests/_utils/secullum-report'

import { InvalidExcelFileError } from '../errors'
import type { THoursBankBalanceInJson, THoursBankInJson } from '../types'
import { parseXlsToJson } from './file'
import {
  extractHoursBankFromJson,
  getInitialBalancesToSave,
  timeToSignedMinutes
} from './hours-bank'

const extract = async (rows: TRow[]): Promise<THoursBankInJson> =>
  extractHoursBankFromJson(await parseXlsToJson(createReportFile(rows)))

const extractDays = async (days: TRow[]): Promise<THoursBankBalanceInJson> => {
  const { balances } = await extract(
    createReportRows({ employees: [createEmployee({ days })] })
  )
  return balances[0]
}

describe('timeToSignedMinutes', () => {
  test.each([
    ['7:20', 440],
    ['07:00*', 420],
    ['83:18:00', 4998],
    ['-3:00', -180],
    ['Folga', null],
    [undefined, null]
  ])('converts %s to %s', (value, expected) => {
    expect(timeToSignedMinutes(value)).toBe(expected)
  })
})

describe('extractHoursBankFromJson', () => {
  test('Extracts the period of the report', async () => {
    const { startDate, endDate } = await extract(createReportRows())

    expect({ startDate, endDate }).toEqual({
      startDate: '2025-10-01',
      endDate: '2025-10-31'
    })
  })

  test('Extracts the totals of each user', async () => {
    const { balances } = await extract(
      createReportRows({
        employees: [
          createEmployee({
            totals: {
              Faltas: '23:37',
              'Ex60%': '83:18:00',
              'Ex100%': '13:40',
              Ajuste: '-3:00'
            },
            days: []
          }),
          createEmployee({ name: 'João Teste', totals: {}, days: [] })
        ]
      })
    )

    expect(balances).toEqual([
      {
        userName: 'Maria Teste',
        absence: 1417,
        overtime60: 4998,
        overtime100: 820,
        adjustment: -180,
        dayOff: 0
      },
      {
        userName: 'João Teste',
        absence: 0,
        overtime60: 0,
        overtime100: 0,
        adjustment: 0,
        dayOff: 0
      }
    ])
  })

  test('Deducts a whole day for a day off and part of it for half a day off', async () => {
    const balance = await extractDays([
      createDayRow('23/10/25 - qui', {
        'Ent. 1': 'FOLGA',
        'Saí. 1': 'FOLGA',
        'Ent. 2': 'FOLGA',
        'Saí. 2': 'FOLGA'
      }),
      createDayRow('24/10/25 - sex', {
        'Ent. 1': '7:07',
        'Saí. 1': '11:05',
        'Ent. 2': 'FOLGA',
        'Saí. 2': 'FOLGA'
      })
    ])

    expect(balance.dayOff).toBe(640)
  })

  test('Credits the rest of the workday for a worked holiday', async () => {
    const balance = await extractDays([
      createDayRow('12/10/25 - feri', {
        'Ent. 1': '08:00*',
        'Saí. 1': '12:00',
        'Ex100%': '4:00'
      }),
      createDayRow('02/11/25 - feri', {
        'Ent. 1': '7:56',
        'Saí. 1': '12:00*',
        'Ent. 2': '15:30*',
        'Saí. 2': '18:00*',
        'Ex100%': '6:34'
      })
    ])

    expect(balance.adjustment).toBe(246)
  })

  test('Ignores the holidays and the days off on a holiday that were not worked', async () => {
    const balance = await extractDays([
      createDayRow('12/10/25 - feri', {
        'Ent. 1': 'Feriado',
        'Saí. 1': 'Feriado',
        DSR: '7:20'
      }),
      createDayRow('15/11/25 - feri', {
        'Ent. 1': 'FOLGA',
        'Saí. 1': 'FOLGA',
        'Ent. 2': 'FOLGA',
        'Saí. 2': 'FOLGA'
      })
    ])

    expect(balance).toMatchObject({ adjustment: 0, dayOff: 0 })
  })

  test('Throws InvalidExcelFileError when a total column is missing', async () => {
    const rows = createReportRows().map((row) =>
      row[0] === REPORT_COLUMNS[0]
        ? row.map((cell) => (cell === 'Ajuste' ? null : cell))
        : row
    )

    await expect(extract(rows)).rejects.toBeInstanceOf(InvalidExcelFileError)
  })
})

describe('getInitialBalancesToSave', () => {
  test('Matches the balances to the users by name and lists the unmatched names', () => {
    const users = [{ id: 'user-1', name: 'Maria Teste' }] as User[]
    const totals = {
      absence: 60,
      dayOff: 0,
      overtime60: 30,
      overtime100: 0,
      adjustment: 0
    }

    const result = getInitialBalancesToSave(
      [
        { userName: 'Maria Teste', ...totals },
        { userName: 'Former Employee', ...totals }
      ],
      users
    )

    expect(result).toEqual({
      balances: [{ userId: 'user-1', ...totals }],
      unmatchedNames: ['Former Employee']
    })
  })
})
