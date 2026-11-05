// @vitest-environment node

import { describe, expect, test } from 'vitest'
import * as xlsx from 'xlsx'

import type { User } from '@/infra/database/types'

import { InvalidExcelFileError } from '../errors'
import { TDataInJson, TPunchRecordInJson, TUserInJson } from '../types'
import {
  ddMMYYYYToDate,
  extractDataFromJson,
  getPunchRecordsToCreate,
  getUsersToUpdate,
  parseXlsToJson
} from './file'

type TRow = (string | null)[]

type TEmployee = {
  registration: string
  name: string
  payrollNumber: string
  cpf: string
  admissionDate: string
  position: string
  department: string
  days: TRow[]
}

// The parser reads the user fields by their distance to the `Departamento` row and the CPF and
// the admission date from the fifth column
const createEmployeeRows = (employee: TEmployee): TRow[] => [
  ['Matrícula:', employee.registration],
  ['Horário:', '08:00 às 17:00'],
  ['Nome:', employee.name],
  ['Nº Folha:', employee.payrollNumber, null, 'CPF:', employee.cpf],
  ['Admissão:', null, null, null, employee.admissionDate],
  ['Função:', employee.position],
  ['Departamento', employee.department],
  ...employee.days
]

const createEmployee = (employee: Partial<TEmployee> = {}): TEmployee => ({
  registration: '42',
  name: 'Maria Teste',
  payrollNumber: '7',
  cpf: '529.982.247-25',
  admissionDate: '15/08/2025',
  position: 'Caixa',
  department: 'Frente de loja',
  days: [
    ['01/10/25 - qua', '07:27', '12:00', '13:00*', '17:02'],
    ['02/10/25 - qui', 'Falta']
  ],
  ...employee
})

const createRows = ({
  cnpj = '11.222.333/0001-81',
  employees = [createEmployee()]
}: { cnpj?: string; employees?: TEmployee[] } = {}): TRow[] => [
  ['CARTÃO PONTO'],
  ['Período:', '01/10/25 a 31/10/25'],
  ['Emissão:', '05/11/25'],
  ['Empresa:', 'Supermercado Teste'],
  ['CNPJ:', cnpj],
  ['Inscrição:', '123456'],
  ...employees.flatMap((employee) => createEmployeeRows(employee))
]

const createFile = (rows: TRow[]): File => {
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(rows))
  const buffer: Buffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  })
  return new File([new Uint8Array(buffer)], 'cartao-ponto.xlsx')
}

const extract = async (rows: TRow[]): Promise<TDataInJson> =>
  extractDataFromJson(await parseXlsToJson(createFile(rows)))

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
      createFile([['CARTÃO PONTO'], ['Empresa:', 'Supermercado Teste']])
    )

    expect(json).toEqual([
      { 'CARTÃO PONTO': 'Empresa:', __EMPTY: 'Supermercado Teste' }
    ])
  })
})

describe('extractDataFromJson', () => {
  test('Extracts the company', async () => {
    const { company } = await extract(createRows())

    expect(company).toEqual({
      name: 'Supermercado Teste',
      cpfCnpj: '11222333000181',
      registration: '123456'
    })
  })

  test('Leaves the CNPJ empty when it is invalid', async () => {
    const { company } = await extract(
      createRows({ cnpj: '11.222.333/0001-82' })
    )

    expect(company.cpfCnpj).toBe('')
  })

  test('Extracts each user', async () => {
    const { users } = await extract(
      createRows({
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
      createRows({
        employees: [
          createEmployee({ cpf: '529.982.247-26', admissionDate: '--/--/----' })
        ]
      })
    )

    expect(users[0]).toMatchObject({ cpf: null, admissionDate: null })
  })

  test('Extracts the punch records of the user above them', async () => {
    const { punchRecords } = await extract(
      createRows({
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
      createRows({
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
