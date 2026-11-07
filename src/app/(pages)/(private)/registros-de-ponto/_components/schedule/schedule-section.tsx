import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { TScheduleWithDays, User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { TIME_FIELDS, TIME_PAIRS, WEEKDAYS } from '@/models/schedule/utils'

import { ScheduleSheet } from './schedule-sheet'
import {
  formatMinutes,
  getScheduleFormValues,
  TIME_FIELD_LABELS,
  WEEKDAY_LABELS
} from './utils'

// Two pairs (entry and exit before and after the break) are the usual day, so the columns never shrink below it
const MIN_PAIR_COLUMNS = 2

const ScheduleTable = ({ schedule }: { schedule: TScheduleWithDays }) => {
  const pairs = Math.max(
    MIN_PAIR_COLUMNS,
    ...schedule.days.map(
      (day) => TIME_PAIRS.filter(({ entry }) => day[entry] !== null).length
    )
  )
  const fields = TIME_FIELDS.slice(0, pairs * 2)

  return (
    <Table aria-labelledby="schedule-title">
      <TableHeader>
        <TableRow>
          <TableHead>Dia</TableHead>
          {fields.map((field) => (
            <TableHead key={field}>{TIME_FIELD_LABELS[field]}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {WEEKDAYS.map(({ key, weekday }) => {
          const day = schedule.days.find((day) => day.weekday === weekday)
          const isDayOff = !day || day.entry1 === null
          return (
            <TableRow key={key}>
              <TableHead scope="row">{WEEKDAY_LABELS[key]}</TableHead>
              {isDayOff ? (
                <TableCell
                  colSpan={fields.length}
                  className="text-muted-foreground"
                >
                  Folga
                </TableCell>
              ) : (
                fields.map((field) => (
                  <TableCell key={field} className="font-mono tabular-nums">
                    {formatMinutes(day[field]) || '—'}
                  </TableCell>
                ))
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export const ScheduleSection = ({
  user,
  schedule,
  defaultStartDate
}: {
  user: User
  schedule: TScheduleWithDays | null
  defaultStartDate: string
}) => (
  <section aria-labelledby="schedule-title" className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-col gap-0.5">
        <h3 id="schedule-title" className="text-base font-medium">
          Escala de horários
        </h3>
        <p className="text-sm text-muted-foreground">
          {schedule
            ? `Vigente a partir de ${dayjs(schedule.startDate).format('DD/MM/YYYY')}`
            : 'Nenhuma escala vigente no período'}
        </p>
      </div>
      <ScheduleSheet
        userId={user.id}
        userName={user.name}
        hasSchedule={!!schedule}
        defaultValues={getScheduleFormValues(schedule, defaultStartDate)}
      />
    </div>
    {schedule && <ScheduleTable schedule={schedule} />}
  </section>
)
