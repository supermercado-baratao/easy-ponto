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
import { WEEKDAY_LABELS } from '@/app/utils/weekday'
import { minutesToTime, WEEKDAYS } from '@/models/schedule/utils'

import type { TAgendaDay, TAgendaRow } from './types'
import { ALERT_LABELS } from './utils'

const AgendaDay = ({ day }: { day: TAgendaDay }) => {
  if (day.pairs.length === 0) {
    return <span className="text-muted-foreground">Folga</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <ul className="font-mono tabular-nums">
        {day.pairs.map(({ entry, exit }) => (
          <li key={entry}>
            {minutesToTime(entry)}
            <span aria-hidden="true">–</span>
            <span className="sr-only"> às </span>
            {minutesToTime(exit)}
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-xs text-muted-foreground">
        <dt>Almoço</dt>
        <dd className="font-mono tabular-nums">{minutesToTime(day.lunch)}</dd>
        <dt>Jornada</dt>
        <dd className="font-mono tabular-nums">{minutesToTime(day.journey)}</dd>
      </dl>
      {day.alerts.length > 0 && (
        <ul
          aria-label="Alertas"
          className="flex flex-col gap-1 text-xs font-medium text-destructive"
        >
          {day.alerts.map((alert) => (
            <li key={alert} className="flex items-center gap-1">
              <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />
              {ALERT_LABELS[alert]}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const AgendaTable = ({ rows }: { rows: TAgendaRow[] }) => (
  <Table aria-label="Expedientes dos funcionários">
    <TableHeader>
      <TableRow>
        <TableHead>Funcionário</TableHead>
        {WEEKDAYS.map(({ key }) => (
          <TableHead key={key}>{WEEKDAY_LABELS[key]}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ user, days }) => (
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
          </TableHead>
          {days ? (
            days.map((day) => (
              <TableCell key={day.key}>
                <AgendaDay day={day} />
              </TableCell>
            ))
          ) : (
            <TableCell
              colSpan={WEEKDAYS.length}
              className="text-muted-foreground"
            >
              Nenhuma escala vigente
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
