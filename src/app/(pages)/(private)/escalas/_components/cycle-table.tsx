import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { TIME_FIELD_LABELS } from '@/app/utils/time-field'
import { TIME_FIELDS, TIME_PAIRS } from '@/constants/time'
import type { TShiftPatternVersionWithDays } from '@/infra/database/types'
import {
  formatCycleTime,
  isDayOff,
  isPastMidnight
} from '@/models/shift-pattern/utils'

// Two pairs (entry and exit before and after the break) are the usual day, so the columns never shrink below it
const MIN_PAIR_COLUMNS = 2

export const CycleTable = ({
  version,
  labelledBy
}: {
  version: TShiftPatternVersionWithDays
  labelledBy: string
}) => {
  const pairs = Math.max(
    MIN_PAIR_COLUMNS,
    ...version.days.map(
      (day) => TIME_PAIRS.filter(({ entry }) => day[entry] !== null).length
    )
  )
  const fields = TIME_FIELDS.slice(0, pairs * 2)
  const hasNextDayTimes = version.days.some((day) =>
    fields.some((field) => isPastMidnight(day[field]))
  )

  return (
    <div className="flex flex-col gap-2">
      <Table aria-labelledby={labelledBy}>
        <TableHeader>
          <TableRow>
            <TableHead>Dia</TableHead>
            {fields.map((field) => (
              <TableHead key={field}>{TIME_FIELD_LABELS[field]}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {version.days.map((day) => (
            <TableRow key={day.cycleDay}>
              <TableHead scope="row">{`Dia ${day.cycleDay}`}</TableHead>
              {isDayOff(day) ? (
                <TableCell
                  colSpan={fields.length}
                  className="text-muted-foreground"
                >
                  Folga
                </TableCell>
              ) : (
                fields.map((field) => (
                  <TableCell key={field} className="font-mono tabular-nums">
                    {formatCycleTime(day[field]) || '—'}
                    {isPastMidnight(day[field]) && (
                      <>
                        <span
                          aria-hidden="true"
                          className="ml-1 text-xs text-muted-foreground"
                        >
                          +1
                        </span>
                        <span className="sr-only"> do dia seguinte</span>
                      </>
                    )}
                  </TableCell>
                ))
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasNextDayTimes && (
        <p aria-hidden="true" className="text-xs text-muted-foreground">
          +1: horário do dia seguinte
        </p>
      )}
    </div>
  )
}
