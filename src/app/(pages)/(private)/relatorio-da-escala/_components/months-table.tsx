import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { TScheduleReportMonth } from '@/models/schedule-report/utils'

import {
  formatAverage,
  formatDate,
  formatMonth,
  PRINTED_TABLE_CONTAINER
} from './utils'

export const MonthsTable = ({
  months,
  limit,
  labelledBy
}: {
  months: TScheduleReportMonth[]
  limit: number | null
  labelledBy: string
}) => (
  <Table aria-labelledby={labelledBy} containerProps={PRINTED_TABLE_CONTAINER}>
    <TableHeader>
      <TableRow>
        <TableHead>Mês</TableHead>
        <TableHead className="text-right">Total de folgas</TableHead>
        <TableHead className="text-right">Média por dia na janela</TableHead>
        <TableHead>Pior dia</TableHead>
        {limit !== null && (
          <TableHead className="text-right">
            Dias com mais de {limit} de folga
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {months.map(
        ({ month, total, windowAverage, worstDay, daysAboveLimit }) => (
          <TableRow key={month}>
            <TableHead scope="row" className="font-normal">
              {formatMonth(month)}
            </TableHead>
            <TableCell className="text-right tabular-nums">{total}</TableCell>
            <TableCell className="text-right tabular-nums">
              {windowAverage === null ? '—' : formatAverage(windowAverage)}
            </TableCell>
            <TableCell className="tabular-nums">
              {worstDay
                ? `${formatDate(worstDay.date)} (${worstDay.off})`
                : '—'}
            </TableCell>
            {limit !== null && (
              <TableCell className="text-right tabular-nums">
                {daysAboveLimit}
              </TableCell>
            )}
          </TableRow>
        )
      )}
    </TableBody>
  </Table>
)
