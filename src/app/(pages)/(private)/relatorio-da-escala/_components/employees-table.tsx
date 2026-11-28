import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getWeekdayLabel } from '@/app/utils/weekday'
import type { TScheduleReportEmployee } from '@/models/schedule-report/utils'

import { formatBalance, PRINTED_TABLE_CONTAINER } from './utils'

const COUNTS = [
  { key: 'cycleRests', label: 'Do ciclo' },
  { key: 'movedRests', label: 'Movidas' },
  { key: 'postponedRests', label: 'Adiadas' },
  { key: 'advancedRests', label: 'Adiantadas' },
  { key: 'unmovedRests', label: 'Sem destino' }
] as const satisfies { key: keyof TScheduleReportEmployee; label: string }[]

export const EmployeesTable = ({
  employees,
  labelledBy
}: {
  employees: TScheduleReportEmployee[]
  labelledBy: string
}) => (
  <Table aria-labelledby={labelledBy} containerProps={PRINTED_TABLE_CONTAINER}>
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Grupos</TableHead>
        <TableHead>Escalas</TableHead>
        <TableHead>Folga do ciclo</TableHead>
        {COUNTS.map(({ key, label }) => (
          <TableHead key={key} className="text-right">
            {label}
          </TableHead>
        ))}
        <TableHead className="text-right">Saldo de horas</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {employees.map((employee) => (
        <TableRow key={employee.userId}>
          <TableHead scope="row" className="font-normal whitespace-normal">
            {employee.name}
          </TableHead>
          <TableCell className="whitespace-normal">
            {employee.groupNames.join(', ') || '—'}
          </TableCell>
          <TableCell className="whitespace-normal">
            {employee.shiftPatternNames.join(', ')}
          </TableCell>
          <TableCell className="whitespace-normal">
            {employee.cycleRestWeekdays
              .map((weekday) => getWeekdayLabel(weekday))
              .join(', ') || '—'}
          </TableCell>
          {COUNTS.map(({ key }) => (
            <TableCell key={key} className="text-right tabular-nums">
              {employee[key]}
            </TableCell>
          ))}
          <TableCell className="text-right font-mono tabular-nums">
            {formatBalance(employee.balance)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
