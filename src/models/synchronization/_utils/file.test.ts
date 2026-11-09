// @vitest-environment node

import { describe, expect, test } from 'vitest'

import type { User } from '@/infra/database/types'
import {
  createEmployee,
  createReportFile,
  createReportRows,
  type TRow
} from '@/tests/_utils/secullum-report'

import { InvalidExcelFileError } from '../errors'
import {
  TDataInJson,
  TPunchRecordInJson,
  TScheduleInJson,
  TUserInJson
} from '../types'
import {
  ddMMYYYYToDate,
  extractDataFromJson,
  getPunchRecordsToCreate,
  getSchedulesToSave,
  getUsersToUpdate,
  parseXlsToJson
} from './file'

const workDay = (weekday: string): Record<string, string> => ({
  [`${weekday}Entry1`]: '07:00',
  [`${weekday}Exit1`]: '11:00',
  [`${weekday}Entry2`]: '13:00',
  [`${weekday}Exit2`]: '16:20',
  [`${weekday}Entry3`]: '',
  [`${weekday}Exit3`]: ''
})

const extract = async (rows: TRow[]): Promise<TDataInJson> =>
  extractDataFromJson(await parseXlsToJson(createReportFile(rows)))

describe('ddMMYYYYToDate', () => {
  test.each([
    ['15/08/2025', '2025-08-15'],
    ['15/01/2025', '2025-01-15'],
    ['31/12/2025', '2025-12-31'],
    ['31/03/2026', '2026-03-31'],
    ['29/02/2024', '2024-02-29']
  ])('converts %s keeping day, month and year', (date, expected) => {
    expect(ddMMYYYYToDate(date).toISOString()).toBe(`${expected}T00:00:00.000Z`)
  })
})

describe('parseXlsToJson', () => {
  test('Reads the first sheet keyed by the first row', async () => {
    const json = await parseXlsToJson(
      createReportFile([['CARTÃO PONTO'], ['Empresa:', 'Supermercado Teste']])
    )

    expect(json).toEqual([
      { 'CARTÃO PONTO': 'Empresa:', __EMPTY: 'Supermercado Teste' }
    ])
  })
})

describe('extractDataFromJson', () => {
  test('Extracts the company', async () => {
    const { company } = await extract(createReportRows())

    expect(company).toEqual({
      name: 'Supermercado Teste',
      cpfCnpj: '11222333000181',
      registration: '123456'
    })
  })

  test('Leaves the CNPJ empty when it is invalid', async () => {
    const { company } = await extract(
      createReportRows({ cnpj: '11.222.333/0001-82' })
    )

    expect(company.cpfCnpj).toBe('')
  })

  test('Extracts each user', async () => {
    const { users } = await extract(
      createReportRows({
        employees: [
          createEmployee(),
          createEmployee({ name: 'João Teste', registration: '43', days: [] })
        ]
      })
    )

    expect(users).toEqual([
      {
        department: 'Frente de loja',
        position: 'Caixa',
        admissionDate: new Date('2025-08-15T00:00:00.000Z'),
        payrollNumber: '7',
        cpf: '52998224725',
        name: 'Maria Teste',
        registration: '42'
      },
      expect.objectContaining({ name: 'João Teste', registration: '43' })
    ])
  })

  test('Leaves the CPF and the admission date empty when they are invalid', async () => {
    const { users } = await extract(
      createReportRows({
        employees: [
          createEmployee({ cpf: '529.982.247-26', admissionDate: '--/--/----' })
        ]
      })
    )

    expect(users[0]).toMatchObject({ cpf: null, admissionDate: null })
  })

  test('Extracts the punch records of the user above them', async () => {
    const { punchRecords } = await extract(
      createReportRows({
        employees: [
          createEmployee(),
          createEmployee({
            name: 'João Teste',
            days: [['03/10/25 - sex', '08:00']]
          })
        ]
      })
    )

    expect(punchRecords).toEqual([
      {
        userName: 'Maria Teste',
        datetime: new Date('2025-10-01T07:27:00.000Z'),
        afdDatetime: new Date('2025-10-01T07:27:00.000Z')
      },
      {
        userName: 'Maria Teste',
        datetime: new Date('2025-10-01T12:00:00.000Z'),
        afdDatetime: new Date('2025-10-01T12:00:00.000Z')
      },
      {
        userName: 'Maria Teste',
        datetime: new Date('2025-10-01T13:00:00.000Z'),
        afdDatetime: null
      },
      {
        userName: 'Maria Teste',
        datetime: new Date('2025-10-01T17:02:00.000Z'),
        afdDatetime: new Date('2025-10-01T17:02:00.000Z')
      },
      {
        userName: 'João Teste',
        datetime: new Date('2025-10-03T08:00:00.000Z'),
        afdDatetime: new Date('2025-10-03T08:00:00.000Z')
      }
    ])
  })

  test('Ignores the rows that are not days of the week', async () => {
    const { punchRecords } = await extract(
      createReportRows({
        employees: [
          createEmployee({
            days: [
              ['Total', '08:00'],
              ['01/10/25 - xyz', '08:00'],
              ['01/10/25 - qua', '8:00', '08:0', 'Folga']
            ]
          })
        ]
      })
    )

    expect(punchRecords).toEqual([])
  })

  test('Extracts the schedule of each user from the start of the period', async () => {
    const { schedules } = await extract(
      createReportRows({
        employees: [
          createEmployee(),
          createEmployee({
            name: 'João Teste',
            schedule: [
              ['SEG', '22:00', '23:30'],
              ['DOM', '6:00', '10:00', '10:15', '12:00', '13:00', '14:00']
            ]
          })
        ]
      })
    )

    expect(schedules).toEqual([
      {
        userName: 'Maria Teste',
        startDate: '2025-10-01',
        ...workDay('monday'),
        ...workDay('tuesday'),
        ...workDay('wednesday'),
        ...workDay('thursday'),
        ...workDay('friday'),
        ...workDay('saturday'),
        sundayEntry1: '',
        sundayExit1: '',
        sundayEntry2: '',
        sundayExit2: '',
        sundayEntry3: '',
        sundayExit3: ''
      },
      {
        userName: 'João Teste',
        startDate: '2025-10-01',
        mondayEntry1: '22:00',
        mondayExit1: '23:30',
        mondayEntry2: '',
        mondayExit2: '',
        mondayEntry3: '',
        mondayExit3: '',
        sundayEntry1: '06:00',
        sundayExit1: '10:00',
        sundayEntry2: '10:15',
        sundayExit2: '12:00',
        sundayEntry3: '13:00',
        sundayExit3: '14:00'
      }
    ])
  })

  test('Skips the users without the schedule block', async () => {
    const { schedules } = await extract(
      createReportRows({ employees: [createEmployee({ schedule: [] })] })
    )

    expect(schedules).toEqual([])
  })

  test('Throws InvalidExcelFileError when the file has another layout', async () => {
    await expect(extract([['Relatório'], ['Outro']])).rejects.toBeInstanceOf(
      InvalidExcelFileError
    )
  })
})

describe('getUsersToUpdate', () => {
  test('Merges the file data into the saved users with the same name', () => {
    const savedUsers = [
      { id: '1', name: 'Maria Teste', pis: '000000000001', cpf: null },
      { id: '2', name: 'João Teste', pis: '000000000002', cpf: null }
    ] as User[]
    const users = [
      { name: 'Maria Teste', cpf: '52998224725', position: 'Caixa' },
      { name: 'Ana Teste', cpf: null, position: 'Gerente' }
    ] as TUserInJson[]

    expect(getUsersToUpdate(savedUsers, users)).toEqual([
      {
        id: '1',
        name: 'Maria Teste',
        pis: '000000000001',
        cpf: '52998224725',
        position: 'Caixa'
      }
    ])
  })
})

describe('getSchedulesToSave', () => {
  test('Returns the schedules of the saved users with the same name', () => {
    const users = [
      { id: '1', companyId: 'company', name: 'Maria Teste' }
    ] as User[]
    const schedules: TScheduleInJson[] = [
      {
        userName: 'Maria Teste',
        startDate: '2025-10-01',
        mondayEntry1: '07:00',
        mondayExit1: '11:00'
      },
      { userName: 'Ana Teste', startDate: '2025-10-01' }
    ]

    expect(getSchedulesToSave(schedules, users)).toEqual([
      {
        companyId: 'company',
        userId: '1',
        startDate: '2025-10-01',
        mondayEntry1: '07:00',
        mondayExit1: '11:00'
      }
    ])
  })
})

describe('getPunchRecordsToCreate', () => {
  test('Returns only the records missing from the AFD of saved users', () => {
    const users = [{ name: 'Maria Teste', pis: '000000000001' }] as User[]
    const datetime = new Date('2025-10-01T13:00:00.000Z')
    const punchRecords: TPunchRecordInJson[] = [
      { userName: 'Maria Teste', datetime, afdDatetime: null },
      { userName: 'Maria Teste', datetime, afdDatetime: datetime },
      { userName: 'Ana Teste', datetime, afdDatetime: null }
    ]

    expect(getPunchRecordsToCreate(punchRecords, users)).toEqual([
      { pis: '000000000001', datetime }
    ])
  })
})
