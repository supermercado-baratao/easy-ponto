import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getOvertimeLabel } from '@/app/utils/overtime'
import type { HoursBankAdjustment } from '@/infra/database/types'
import type { THoursBankRow } from '@/models/hours-bank/types'
import { getOvertimeMinutes } from '@/models/journey/utils'
import type { TPunchRecordPeriod } from '@/models/punch-record/types'

import { RowActionsMenu } from '../adjustment/row-actions-menu'
import { formatSignedMinutes, getPunchRecordsHref } from '../utils'

type TTotalColumn = {
  key: string
  label: string
  getMinutes: (row: THoursBankRow) => number
}

const getTotalColumns = (overtimePercentages: number[]): TTotalColumn[] => [
  { key: 'absence', label: 'Faltas', getMinutes: (row) => row.absence },
  { key: 'lateness', label: 'Atrasos', getMinutes: (row) => row.lateness },
  {
    key: 'compensation',
    label: 'Compensações',
    getMinutes: (row) => row.compensation
  },
  ...overtimePercentages.map((percentage) => ({
    key: `overtime-${percentage}`,
    label: getOvertimeLabel(percentage, { plural: true }),
    getMinutes: (row: THoursBankRow) =>
      getOvertimeMinutes(row.overtime, percentage)
  })),
  { key: 'adjustment', label: 'Ajustes', getMinutes: (row) => row.adjustment }
]

const formatTotal = (minutes: number): string =>
  minutes === 0 ? '' : formatSignedMinutes(minutes)

export const HoursReportTable = ({
  rows,
  period,
  overtimePercentages,
  adjustments,
  editable
}: {
  rows: THoursBankRow[]
  period: TPunchRecordPeriod
  overtimePercentages: number[]
  adjustments: HoursBankAdjustment[]
  editable: boolean
}) => {
  const totalColumns = getTotalColumns(overtimePercentages)
  return (
    <Table aria-label="Relatório de horas">
      <TableHeader>
        <TableRow>
          <TableHead>Funcionário</TableHead>
          <TableHead>Saldo anterior</TableHead>
          {totalColumns.map(({ key, label }) => (
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
            {totalColumns.map(({ key, getMinutes }) => (
              <TableCell key={key} className="font-mono tabular-nums">
                {formatTotal(getMinutes(row))}
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
}
