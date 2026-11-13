import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { HoursBankAdjustment } from '@/infra/database/types'
import type { THoursBankRow, THoursBankTotals } from '@/models/hours-bank/types'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import { RowActionsMenu } from '../adjustment/row-actions-menu'
import { formatSignedMinutes, getPunchRecordsHref } from '../utils'

const TOTAL_COLUMNS: { key: keyof THoursBankTotals; label: string }[] = [
  { key: 'absence', label: 'Faltas' },
  { key: 'lateness', label: 'Atrasos' },
  { key: 'dayOff', label: 'Folgas' },
  { key: 'overtime60', label: 'Extras 60%' },
  { key: 'overtime100', label: 'Extras 100%' },
  { key: 'adjustment', label: 'Ajustes' }
]

const formatTotal = (minutes: number): string =>
  minutes === 0 ? '' : formatSignedMinutes(minutes)

export const HoursReportTable = ({
  rows,
  period,
  adjustments,
  editable
}: {
  rows: THoursBankRow[]
  period: TPunchRecordPeriod
  adjustments: HoursBankAdjustment[]
  editable: boolean
}) => (
  <Table aria-label="Relatório de horas">
    <TableHeader>
      <TableRow>
        <TableHead>Funcionário</TableHead>
        <TableHead>Saldo anterior</TableHead>
        {TOTAL_COLUMNS.map(({ key, label }) => (
          <TableHead key={key}>{label}</TableHead>
        ))}
        <TableHead>Saldo</TableHead>
        {editable && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.userId}>
          <TableCell>
            <Link
              href={getPunchRecordsHref({ pis: row.pis, ...period })}
              className="underline-offset-4 hover:underline"
            >
              {row.name}
            </Link>
          </TableCell>
          <TableCell className="font-mono tabular-nums">
            {formatSignedMinutes(row.previousBalance)}
          </TableCell>
          {TOTAL_COLUMNS.map(({ key }) => (
            <TableCell key={key} className="font-mono tabular-nums">
              {formatTotal(row[key])}
            </TableCell>
          ))}
          <TableCell
            className={
              row.balance < 0
                ? 'font-mono font-medium text-destructive tabular-nums'
                : 'font-mono font-medium tabular-nums'
            }
          >
            {formatSignedMinutes(row.balance)}
          </TableCell>
          {editable && (
            <TableCell>
              <div className="flex justify-end">
                <RowActionsMenu
                  user={{ id: row.userId, name: row.name }}
                  adjustments={adjustments.filter(
                    ({ userId }) => userId === row.userId
                  )}
                />
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
