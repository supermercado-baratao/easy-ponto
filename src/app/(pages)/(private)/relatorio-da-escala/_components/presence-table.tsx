import { cn } from 'cn'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getWeekdayLabel } from '@/app/utils/weekday'
import type { TPresenceTable } from '@/models/schedule-report/utils'

import { formatAverage, formatHour, PRINTED_TABLE_CONTAINER } from './utils'

// Fixed steps instead of a continuous shade, since each one has a text color with enough contrast in
// both themes; the steps follow the busiest hour of the table, so each group reads by its own size
const SHADES = [
  '',
  'bg-primary/15',
  'bg-primary/35',
  'bg-primary text-primary-foreground print:text-inherit'
]

const getShade = (value: number, max: number): string =>
  value > 0 ? SHADES[Math.ceil((value / max) * (SHADES.length - 1))] : ''

export const PresenceTable = ({
  labelledBy,
  hours,
  rows
}: {
  labelledBy: string
  hours: number[]
  rows: TPresenceTable['rows']
}) => {
  const max = Math.max(0, ...rows.flatMap(({ values }) => values))
  return (
    <Table
      aria-labelledby={labelledBy}
      className="text-xs"
      containerProps={PRINTED_TABLE_CONTAINER}
    >
      <TableHeader>
        <TableRow>
          <TableHead>Dia</TableHead>
          {hours.map((hour) => (
            <TableHead key={hour} className="px-1 text-center">
              {formatHour(hour)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(({ weekday, values }) => (
          <TableRow key={weekday}>
            <TableHead scope="row" className="font-normal">
              {getWeekdayLabel(weekday)}
            </TableHead>
            {values.map((value, index) => (
              <TableCell
                key={hours[index]}
                className={cn(
                  'px-1 text-center tabular-nums print:bg-transparent',
                  getShade(value, max)
                )}
              >
                {formatAverage(value)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
