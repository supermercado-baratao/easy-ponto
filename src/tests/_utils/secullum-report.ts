import * as xlsx from 'xlsx'

export type TRow = (string | null)[]

export type TEmployee = {
  registration: string
  name: string
  payrollNumber: string
  cpf: string
  admissionDate: string
  position: string
  department: string
  schedule: TRow[]
  days: TRow[]
}

const WORK_DAY = ['7:00', '11:00', '13:00', '16:20']

const DAY_OFF = ['Folga', 'Folga', 'Folga', 'Folga', 'Folga', 'Folga']

const EMPLOYEE_COLUMNS = 6

const padEmployeeCells = (cells: TRow): TRow => [
  ...cells,
  ...Array.from({ length: EMPLOYEE_COLUMNS - cells.length }, () => null)
]

// Mirrors the layout of the Secullum report: the parser reads the user fields by their distance
// to the `Departamento` row, the CPF and the admission date from the fifth column and the
// "Horário de Trabalho" block from the seven rows above `Departamento`, next to the user fields
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
  days: [
    ['01/10/25 - qua', '07:27', '12:00', '13:00*', '17:02'],
    ['02/10/25 - qui', 'Falta']
  ],
  ...employee
})

export const createReportRows = ({
  cnpj = '11.222.333/0001-81',
  employees = [createEmployee()]
}: { cnpj?: string; employees?: TEmployee[] } = {}): TRow[] => [
  ['CARTÃO PONTO'],
  ['De: 01/10/2025 até 31/10/2025'],
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
