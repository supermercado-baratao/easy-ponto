import { TriangleAlert } from 'lucide-react'
import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getAlertLabel } from '@/app/utils/schedule-alert'
import { dayjs } from '@/infra/dayjs'
import { minutesToTime } from '@/infra/time'
import type { TScheduleAlertLimits } from '@/models/journey/types'
import { formatCycleTime, isPastMidnight } from '@/models/shift-pattern/utils'

import type { TAgendaDay, TAgendaRow } from './types'

const CycleTime = ({ minutes }: { minutes: number }) => (
  <>
    {formatCycleTime(minutes)}
    {isPastMidnight(minutes) && (
      <>
        <span aria-hidden="true" className="ml-1 text-xs text-muted-foreground">
          +1
        </span>
        <span className="sr-only"> do dia seguinte</span>
      </>
    )}
  </>
)

const AgendaDay = ({
  day,
  limits
}: {
  day: TAgendaDay
  limits: TScheduleAlertLimits
}) => {
  const adjusted = day.adjusted && (
    <p className="text-xs text-muted-foreground">Dia ajustado</p>
  )
  if (day.kind !== 'work') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-muted-foreground">
          {day.kind === 'off' ? 'Folga' : 'Sem escala'}
        </span>
        {adjusted}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <ul className="font-mono tabular-nums">
        {day.pairs.map(({ entry, exit }) => (
          <li key={entry}>
            <CycleTime minutes={entry} />
            <span aria-hidden="true">–</span>
            <span className="sr-only"> às </span>
            <CycleTime minutes={exit} />
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-xs text-muted-foreground">
        <dt>Almoço</dt>
        <dd className="font-mono tabular-nums">{minutesToTime(day.lunch)}</dd>
        <dt>Jornada</dt>
        <dd className="font-mono tabular-nums">{minutesToTime(day.journey)}</dd>
      </dl>
      {adjusted}
      {day.alerts.length > 0 && (
        <ul
          aria-label="Alertas"
          className="flex flex-col gap-1 text-xs font-medium text-destructive"
        >
          {day.alerts.map((alert) => (
            <li key={alert} className="flex items-center gap-1">
              <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
              {getAlertLabel(alert, limits)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const AgendaTable = ({
  rows,
  dates,
  limits
}: {
  rows: TAgendaRow[]
  dates: string[]
  limits: TScheduleAlertLimits
}) => (
  <Table aria-label="Expedientes dos funcionários">
    <TableHeader>
      <TableRow>
        <TableHead>Funcionário</TableHead>
        {dates.map((date) => {
          const day = dayjs(date)
          return (
            <TableHead key={date}>
              <span className="capitalize">{day.format('ddd')}</span>{' '}
              <span className="font-mono tabular-nums">
                {day.format('DD/MM')}
              </span>
            </TableHead>
          )
        })}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ user, shiftPatternNames, days }) => (
        <TableRow key={user.id} className="[&>td]:align-top [&>th]:align-top">
          <TableHead scope="row" className="py-2 font-normal">
            <Link
              href={`/registros-de-ponto?${new URLSearchParams({ pis: user.pis })}`}
              className="underline-offset-4 hover:underline"
            >
              <span className="sr-only">Registros de ponto de </span>
              {user.name}
            </Link>
            {user.position && (
              <p className="text-xs text-muted-foreground">{user.position}</p>
            )}
            {shiftPatternNames.length > 0 && (
              <p className="text-xs text-muted-foreground">
                <span className="sr-only">
                  {shiftPatternNames.length > 1 ? 'Escalas: ' : 'Escala: '}
                </span>
                {shiftPatternNames.join(', ')}
              </p>
            )}
          </TableHead>
          {days ? (
            days.map((day) => (
              <TableCell key={day.date}>
                <AgendaDay day={day} limits={limits} />
              </TableCell>
            ))
          ) : (
            <TableCell colSpan={dates.length} className="text-muted-foreground">
              Nenhuma escala vigente
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
