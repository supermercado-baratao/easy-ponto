// @vitest-environment node

import { describe, expect, test } from 'vitest'

import { InvalidExcelFileError } from '@/models/time-card-report/errors'
import type { TReportBalance } from '@/models/time-card-report/types'
import {
  createDayRow,
  createEmployee,
  createReportFile,
  createReportRows,
  REPORT_COLUMNS,
  type TRow
} from '@/tests/_utils/secullum-report'

import { parseXlsToJson } from './file'
import { extractHoursBankFromJson, timeToSignedMinutes } from './hours-bank'

const extract = async (rows: TRow[]): Promise<TReportBalance[]> =>
  extractHoursBankFromJson(await parseXlsToJson(createReportFile(rows)))

const extractDays = async (days: TRow[]): Promise<TReportBalance> => {
  const [balance] = await extract(
    createReportRows({ employees: [createEmployee({ days })] })
  )
  return balance
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
  test('Extracts the totals of each user', async () => {
    const balances = await extract(
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
        overtime: [
          { percentage: 60, minutes: 4998 },
          { percentage: 100, minutes: 820 }
        ],
        adjustment: -180,
        justificationMinutes: {}
      },
      {
        userName: 'João Teste',
        absence: 0,
        overtime: [],
        adjustment: 0,
        justificationMinutes: {}
      }
    ])
  })

  test('Counts a whole workday for a code in two pairs and half a day for a code in one', async () => {
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
      }),
      createDayRow('25/10/25 - sáb', {
        'Ent. 1': 'ATESTADO',
        'Saí. 1': 'ATESTADO',
        'Ent. 2': 'ATESTADO',
        'Saí. 2': 'ATESTADO'
      })
    ])

    expect(balance.justificationMinutes).toEqual({ FOLGA: 640, ATESTADO: 440 })
  })

  test('Ignores the weekly rest and the unjustified absences', async () => {
    const balance = await extractDays([
      createDayRow('26/10/25 - dom', {
        'Ent. 1': 'Folga',
        'Saí. 1': 'Folga',
        'Ent. 2': 'Folga',
        'Saí. 2': 'Folga'
      }),
      createDayRow('27/10/25 - seg', {
        'Ent. 1': 'Falta',
        'Saí. 1': 'Falta',
        'Ent. 2': 'Falta',
        'Saí. 2': 'Falta'
      })
    ])

    expect(balance.justificationMinutes).toEqual({})
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

  test('Ignores the holidays not worked and the codes on them', async () => {
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

    expect(balance).toMatchObject({ adjustment: 0, justificationMinutes: {} })
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
