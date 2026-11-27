import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { minutesToTime } from '@/infra/time'

import type { TCalendarFilters, TCalendarRow } from './types'
import { getCalendarHref } from './utils'

export const SummaryTable = ({
  month,
  rows,
  filters
}: {
  month: string
  rows: TCalendarRow[]
  filters: TCalendarFilters
}) => (
  <Table aria-label="Resumo do mês de cada funcionário">
    <TableHeader>
      <TableRow>
        <TableHead>Funcionário</TableHead>
        <TableHead>Escalas</TableHead>
        <TableHead className="text-right">Dias de trabalho</TableHead>
        <TableHead className="text-right">Folgas</TableHead>
        <TableHead className="text-right">Feriados</TableHead>
        <TableHead className="text-right">Ajustes</TableHead>
        <TableHead className="text-right">Carga</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ user, summary }) => {
        const selected = user.id === filters.userId
        return (
          <TableRow
            key={user.id}
            data-state={selected ? 'selected' : undefined}
          >
            <TableHead scope="row" className="font-normal">
              <Link
                href={getCalendarHref({ month, userId: user.id, filters })}
                aria-current={selected ? 'page' : undefined}
                className="underline-offset-4 hover:underline"
              >
                {user.name}
              </Link>
            </TableHead>
            <TableCell>
              {summary.shiftPatternNames.join(', ') || 'Sem escala'}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {summary.workdays}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {summary.daysOff}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {summary.holidays}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {summary.adjustments}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">
              {minutesToTime(summary.workload)}
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
