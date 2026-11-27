import { Badge } from '@/app/components/ui/shadcn/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { WEEKDAY_LABELS } from '@/app/utils/weekday'
import { minutesToTime } from '@/infra/time'
import { formatCycleTime } from '@/models/shift-pattern/utils'
import type { TCalendarDay } from '@/models/workload-calendar/types'

import { DaySheet } from './day-sheet/day-sheet'
import type { TCalendarUserMonthView } from './types'

const SUNDAY_FIRST_WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const

const KIND_LABELS: Record<TCalendarDay['kind'], string> = {
  work: 'Trabalho',
  off: 'Folga',
  unassigned: 'Sem escala'
}

const formatPair = ({ entry, exit }: TCalendarDay['pairs'][number]): string =>
  `${formatCycleTime(entry)}–${formatCycleTime(exit)}`

const getDaySchedule = (day: TCalendarDay): string => {
  if (day.kind !== 'work') return KIND_LABELS[day.kind]
  const pairs = day.pairs.map((pair) => formatPair(pair)).join(', ')
  return day.holidayName
    ? pairs
    : `${pairs}, carga ${minutesToTime(day.workload)}`
}

const getDayLabel = (day: TCalendarDay): string =>
  [
    `${day.day}:`,
    day.holidayName && `${day.holidayName},`,
    getDaySchedule(day),
    day.adjusted && '(ajustado)'
  ]
    .filter(Boolean)
    .join(' ')

const CalendarDay = ({ day }: { day: TCalendarDay }) => (
  <>
    <span className="text-xs text-muted-foreground tabular-nums">
      {day.day}
    </span>
    {day.holidayName && (
      <span className="text-sm font-medium">{day.holidayName}</span>
    )}
    {day.kind === 'work' ? (
      <span
        className={
          day.holidayName
            ? 'flex flex-col text-xs text-muted-foreground'
            : 'flex flex-col text-sm'
        }
      >
        {day.pairs.map(({ entry, exit }) => (
          <span
            key={entry}
            className="font-mono whitespace-nowrap tabular-nums"
          >
            {formatPair({ entry, exit })}
          </span>
        ))}
        {!day.holidayName && (
          <span className="font-mono font-medium tabular-nums">
            {minutesToTime(day.workload)}
          </span>
        )}
      </span>
    ) : (
      <span
        className={
          day.holidayName
            ? 'text-xs text-muted-foreground'
            : 'text-sm text-muted-foreground'
        }
      >
        {KIND_LABELS[day.kind]}
      </span>
    )}
    {day.adjusted && <Badge variant="outline">Ajustado</Badge>}
  </>
)

export const MonthGrid = ({
  selection: { user, weeks, assignments },
  canEdit
}: {
  selection: TCalendarUserMonthView
  canEdit: boolean
}) => (
  <Table aria-label={`Dias do mês de ${user.name}`}>
    <TableHeader>
      <TableRow>
        {SUNDAY_FIRST_WEEKDAYS.map((key) => (
          <TableHead key={key}>{WEEKDAY_LABELS[key]}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {weeks.map((days, index) => (
        <TableRow key={index} className="[&>td]:align-top">
          {days.map((day, dayIndex) => (
            <TableCell
              key={day?.date ?? `empty-${dayIndex}`}
              className="h-24 min-w-28 p-1"
            >
              {day &&
                (canEdit ? (
                  <DaySheet
                    userId={user.id}
                    name={user.name}
                    day={day}
                    assignments={assignments}
                    label={getDayLabel(day)}
                  >
                    <CalendarDay day={day} />
                  </DaySheet>
                ) : (
                  <div className="flex flex-col gap-1 p-1">
                    <CalendarDay day={day} />
                  </div>
                ))}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
