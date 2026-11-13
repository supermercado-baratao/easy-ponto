// @vitest-environment node

import { describe, expect, test } from 'vitest'

import {
  createDayRow,
  createEmployee,
  createReportFile,
  createReportRows,
  type TEmployee,
  type TRow
} from '@/tests/_utils/secullum-report'

import { InvalidExcelFileError } from '../errors'
import type { TJustificationInJson } from '../types'
import { extractDataFromJson, parseXlsToJson } from './file'
import { extractJustificationsFromJson } from './justification'

const wholeDay = (code: string): Record<string, string> => ({
  'Ent. 1': code,
  'Saí. 1': code,
  'Ent. 2': code,
  'Saí. 2': code,
  'Ent. 3': code,
  'Saí. 3': code
})

const extract = async (
  employees: TEmployee[]
): Promise<TJustificationInJson[]> => {
  const json = await parseXlsToJson(
    createReportFile(createReportRows({ employees }))
  )
  return extractJustificationsFromJson(
    json,
    extractDataFromJson(json).schedules
  )
}

const extractDays = async (days: TRow[]): Promise<TJustificationInJson[]> =>
  await extract([createEmployee({ days })])

describe('extractJustificationsFromJson', () => {
  test('Creates a whole day justification when the code fills every pair of the schedule', async () => {
    const justifications = await extractDays([
      createDayRow('07/10/25 - ter', {
        'Ent. 1': 'ABONO',
        'Saí. 1': 'ABONO',
        'Ent. 2': 'ABONO',
        'Saí. 2': 'ABONO'
      })
    ])

    expect(justifications).toEqual([
      {
        userName: 'Maria Teste',
        code: 'ABONO',
        startDate: '2025-10-07',
        endDate: '2025-10-07',
        startTime: '',
        endTime: ''
      }
    ])
  })

  test('Merges the consecutive days with the same whole day code, including the days off', async () => {
    const justifications = await extractDays([
      createDayRow('10/10/25 - sex', wholeDay('FERIAS')),
      createDayRow('11/10/25 - sáb', wholeDay('FERIAS')),
      createDayRow('12/10/25 - dom', wholeDay('FERIAS')),
      createDayRow('13/10/25 - seg', wholeDay('FERIAS')),
      createDayRow('14/10/25 - ter', { 'Ent. 1': '07:00' }),
      createDayRow('15/10/25 - qua', wholeDay('FERIAS'))
    ])

    expect(justifications).toMatchObject([
      { code: 'FERIAS', startDate: '2025-10-10', endDate: '2025-10-13' },
      { code: 'FERIAS', startDate: '2025-10-15', endDate: '2025-10-15' }
    ])
  })

  test('Does not merge the whole days of different codes or employees', async () => {
    const firstDays = [
      createDayRow('06/10/25 - seg', wholeDay('INSS')),
      createDayRow('07/10/25 - ter', wholeDay('ABONO'))
    ]
    const secondDays = [createDayRow('08/10/25 - qua', wholeDay('INSS'))]

    const justifications = await extract([
      createEmployee({ days: firstDays }),
      createEmployee({ name: 'João Teste', days: secondDays })
    ])

    expect(justifications).toMatchObject([
      { userName: 'Maria Teste', code: 'INSS', endDate: '2025-10-06' },
      { userName: 'Maria Teste', code: 'ABONO', startDate: '2025-10-07' },
      { userName: 'João Teste', code: 'INSS', startDate: '2025-10-08' }
    ])
  })

  test('Creates a shift justification with the times of the pair in the schedule', async () => {
    const justifications = await extractDays([
      createDayRow('07/10/25 - ter', {
        'Ent. 1': '7:04',
        'Saí. 1': '11:09',
        'Ent. 2': 'FOLGA',
        'Saí. 2': 'FOLGA'
      }),
      createDayRow('08/10/25 - qua', {
        'Ent. 1': 'ATESCOM',
        'Saí. 1': 'ATESCOM'
      })
    ])

    expect(justifications).toEqual([
      {
        userName: 'Maria Teste',
        code: 'FOLGA',
        startDate: '2025-10-07',
        endDate: '2025-10-07',
        startTime: '13:00',
        endTime: '16:20'
      },
      {
        userName: 'Maria Teste',
        code: 'ATESCOM',
        startDate: '2025-10-08',
        endDate: '2025-10-08',
        startTime: '07:00',
        endTime: '11:00'
      }
    ])
  })

  test('Creates one justification per shift when a day has two codes', async () => {
    const justifications = await extractDays([
      createDayRow('07/10/25 - ter', {
        'Ent. 1': 'ATESMED',
        'Saí. 1': 'ATESMED',
        'Ent. 2': 'FOLGA',
        'Saí. 2': 'FOLGA'
      })
    ])

    expect(justifications).toMatchObject([
      { code: 'ATESMED', startTime: '07:00', endTime: '11:00' },
      { code: 'FOLGA', startTime: '13:00', endTime: '16:20' }
    ])
  })

  test('Does not merge consecutive shift justifications', async () => {
    const shift = { 'Ent. 2': 'FOLGA', 'Saí. 2': 'FOLGA' }
    const justifications = await extractDays([
      createDayRow('07/10/25 - ter', shift),
      createDayRow('08/10/25 - qua', shift)
    ])

    expect(justifications).toMatchObject([
      { startDate: '2025-10-07', endDate: '2025-10-07' },
      { startDate: '2025-10-08', endDate: '2025-10-08' }
    ])
  })

  test('Creates a whole day justification when the code is in a pair the schedule does not have', async () => {
    const justifications = await extractDays([
      createDayRow('07/10/25 - ter', {
        'Ent. 1': '7:00',
        'Saí. 1': '11:00',
        'Ent. 3': 'ABONO',
        'Saí. 3': 'ABONO'
      })
    ])

    expect(justifications).toMatchObject([
      { code: 'ABONO', startTime: '', endTime: '' }
    ])
  })

  test('Creates a whole day justification for an employee without a schedule', async () => {
    const justifications = await extract([
      createEmployee({
        schedule: [],
        days: [
          createDayRow('07/10/25 - ter', {
            'Ent. 1': 'ABONO',
            'Saí. 1': 'ABONO'
          })
        ]
      })
    ])

    expect(justifications).toMatchObject([
      { code: 'ABONO', startTime: '', endTime: '' }
    ])
  })

  test('Ignores the weekly rest, the holidays and the unjustified absences, matching the case', async () => {
    const justifications = await extractDays([
      createDayRow('05/10/25 - dom', wholeDay('Folga')),
      createDayRow('12/10/25 - feri', wholeDay('Feriado')),
      createDayRow('13/10/25 - seg', { 'Ent. 1': 'Falta' }),
      createDayRow('14/10/25 - ter', {
        'Ent. 1': 'FOLGA',
        'Saí. 1': 'FOLGA',
        'Ent. 2': 'FOLGA',
        'Saí. 2': 'FOLGA'
      })
    ])

    expect(justifications).toMatchObject([
      { code: 'FOLGA', startDate: '2025-10-14' }
    ])
  })

  test('Reads the justifications of the holiday rows', async () => {
    const justifications = await extractDays([
      createDayRow('12/10/25 - feri', wholeDay('INSS'))
    ])

    expect(justifications).toMatchObject([
      { code: 'INSS', startDate: '2025-10-12', endDate: '2025-10-12' }
    ])
  })

  test('Throws InvalidExcelFileError when the employee header is incomplete', () => {
    expect(() =>
      extractJustificationsFromJson([{ 'CARTÃO PONTO': 'Departamento' }], [])
    ).toThrow(InvalidExcelFileError)
  })
})
