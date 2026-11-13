import * as xlsx from 'xlsx'

export type TRow = (string | null)[]

export const REPORT_COLUMNS = [
  'Data',
  'Ent. 1',
  'Saí. 1',
  'Ent. 2',
  'Saí. 2',
  'Carga',
  'Normais',
  'Faltas',
  'Ex60%',
  'Ent. 3',
  'Saí. 3',
  'Ex100%',
  'DSR',
  'DSR.Deb',
  'Ajuste'
] as const

type TReportColumn = (typeof REPORT_COLUMNS)[number]

export type TReportCells = Partial<Record<TReportColumn, string>>

export type TEmployee = {
  registration: string
  name: string
  payrollNumber: string
  cpf: string
  admissionDate: string
  position: string
  department: string
  schedule: TRow[]
  totals: TReportCells
  days: TRow[]
}

const WORK_DAY = ['7:00', '11:00', '13:00', '16:20']

const DAY_OFF = ['Folga', 'Folga', 'Folga', 'Folga', 'Folga', 'Folga']

const EMPLOYEE_COLUMNS = 6

const padEmployeeCells = (cells: TRow): TRow => [
  ...cells,
  ...Array.from({ length: EMPLOYEE_COLUMNS - cells.length }, () => null)
]

export const createDayRow = (label: string, cells: TReportCells = {}): TRow =>
  REPORT_COLUMNS.map((column, index) =>
    index === 0 ? label : (cells[column] ?? null)
  )

// Mirrors the layout of the Secullum report: the parser reads the user fields by their distance
// to the `Departamento` row, the CPF and the admission date from the fifth column, the
// "Horário de Trabalho" block from the seven rows above `Departamento`, next to the user fields,
// and the totals from the two rows below it (the column labels and the totals of the period)
const createEmployeeRows = (employee: TEmployee): TRow[] => {
  const employeeCells: TRow[] = [
    [],
    ['Matrícula:', employee.registration],
    ['Horário:', '08:00 às 17:00'],
    ['Nome:', employee.name],
    ['Nº Folha:', employee.payrollNumber, null, 'CPF:', employee.cpf],
    ['Admissão:', null, null, null, employee.admissionDate],
    ['Função:', employee.position]
  ]
  return [
    [...padEmployeeCells([]), 'Horário de Trabalho'],
    [
      ...padEmployeeCells([]),
      null,
      'Ent1',
      'Sai1',
      'Ent2',
      'Sai2',
      'Ent3',
      'Sai3'
    ],
    ...employeeCells.map((cells, index) => [
      ...padEmployeeCells(cells),
      ...(employee.schedule[index] ?? [])
    ]),
    ['Departamento', employee.department],
    [...REPORT_COLUMNS],
    REPORT_COLUMNS.map((column) => employee.totals[column] ?? null),
    ...employee.days
  ]
}

export const createEmployee = (
  employee: Partial<TEmployee> = {}
): TEmployee => ({
  registration: '42',
  name: 'Maria Teste',
  payrollNumber: '7',
  cpf: '529.982.247-25',
  admissionDate: '15/08/2025',
  position: 'Caixa',
  department: 'Frente de loja',
  schedule: [
    ['SEG', ...WORK_DAY],
    ['TER', ...WORK_DAY],
    ['QUA', ...WORK_DAY],
    ['QUI', ...WORK_DAY],
    ['SEX', ...WORK_DAY],
    ['SÁB', ...WORK_DAY],
    ['DOM', ...DAY_OFF]
  ],
  totals: {
    Carga: '7:20',
    Faltas: '7:20',
    'Ex60%': '0:00',
    'Ex100%': '0:00',
    Ajuste: '0:00'
  },
  days: [
    ['01/10/25 - qua', '07:27', '12:00', '13:00*', '17:02'],
    ['02/10/25 - qui', 'Falta']
  ],
  ...employee
})

export const createReportRows = ({
  cnpj = '11.222.333/0001-81',
  period = '01/10/2025 até 31/10/2025',
  employees = [createEmployee()]
}: {
  cnpj?: string
  period?: string
  employees?: TEmployee[]
} = {}): TRow[] => [
  ['CARTÃO PONTO'],
  [`De: ${period}`],
  ['Emissão:', '05/11/25'],
  ['Empresa:', 'Supermercado Teste'],
  ['CNPJ:', cnpj],
  ['Inscrição:', '123456'],
  ...employees.flatMap((employee) => createEmployeeRows(employee))
]

export const createReportFile = (rows: TRow[]): File => {
  const workbook = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(rows))
  const buffer: Buffer = xlsx.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  })
  return new File([new Uint8Array(buffer)], 'cartao-ponto.xlsx')
}
