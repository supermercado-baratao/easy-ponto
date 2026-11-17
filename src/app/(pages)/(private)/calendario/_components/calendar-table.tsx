import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { WEEKDAY_LABELS } from '@/app/utils/weekday'
import { minutesToTime } from '@/models/schedule/utils'
import type {
  TWorkloadCalendar,
  TWorkloadDay
} from '@/models/workload-calendar/types'

const SUNDAY_FIRST_WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
] as const

const CalendarDay = ({ day }: { day: TWorkloadDay }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground tabular-nums">
      {day.day}
    </span>
    {day.workload > 0 ? (
      <span className="font-mono tabular-nums">
        {minutesToTime(day.workload)}
      </span>
    ) : (
      <span className="text-sm text-muted-foreground">
        {day.holidayName ?? 'Folga'}
      </span>
    )}
  </div>
)

export const CalendarTable = ({
  calendar: { weeks }
}: {
  calendar: TWorkloadCalendar
}) => (
  <Table aria-label="Carga horária de cada dia do mês">
    <TableHeader>
      <TableRow>
        {SUNDAY_FIRST_WEEKDAYS.map((key) => (
          <TableHead key={key}>{WEEKDAY_LABELS[key]}</TableHead>
        ))}
        <TableHead className="text-right">Total da semana</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {weeks.map(({ days, total }, index) => (
        <TableRow key={index} className="[&>td]:align-top">
          {days.map((day, dayIndex) => (
            <TableCell key={day?.date ?? `empty-${dayIndex}`}>
              {day && <CalendarDay day={day} />}
            </TableCell>
          ))}
          <TableCell className="text-right font-mono font-medium tabular-nums">
            {minutesToTime(total)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
