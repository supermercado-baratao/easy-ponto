import { TriangleAlert } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type {
  PunchRecord,
  TJustificationWithType
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { TJourney, TJourneyDay } from '@/models/journey/types'
import { coversDate } from '@/models/justification/utils'
import { minutesToTime } from '@/models/schedule/utils'

import { DayActionsMenu } from '../justification/day-actions-menu'
import {
  getJustificationLabel,
  getJustificationShortLabel
} from '../justification/utils'

// Four punches (two entries and two exits) are the usual day, so the columns never shrink below it
const MIN_PUNCH_COLUMNS = 4

const PunchRecordCell = ({ record }: { record?: PunchRecord }) => {
  if (!record) return <TableCell />

  const time = dayjs(record.datetime).format('HH:mm')
  return (
    <TableCell className="font-mono tabular-nums">
      {record.nsr === null ? (
        <>
          {time}
          <span aria-hidden="true">*</span>
          <span className="sr-only"> (inserida manualmente)</span>
        </>
      ) : (
        time
      )}
    </TableCell>
  )
}

const BALANCE_COLUMNS = [
  { key: 'absence', label: 'Falta' },
  { key: 'lateness', label: 'Atraso' },
  { key: 'dayOff', label: 'Folga (banco)' },
  { key: 'overtime60', label: 'Extra 60%' },
  { key: 'overtime100', label: 'Extra 100%' }
] as const

const ODD_PUNCHES_LABEL = 'Número ímpar de batidas'

const formatMinutes = (minutes: number): string =>
  minutes === 0 ? '' : minutesToTime(minutes)

const isCalculated = ({ kind }: TJourney): boolean =>
  kind !== 'no-schedule' && kind !== 'future'

const ExpectedCell = ({ journey }: { journey: TJourney }) => {
  switch (journey.kind) {
    case 'workday': {
      return (
        <TableCell className="font-mono tabular-nums">
          {minutesToTime(journey.expected)}
        </TableCell>
      )
    }
    case 'holiday': {
      return (
        <TableCell className="text-muted-foreground">
          {journey.holidayName ? (
            <>
              <span aria-hidden="true" title={journey.holidayName}>
                Feriado
              </span>
              <span className="sr-only">{`Feriado: ${journey.holidayName}`}</span>
            </>
          ) : (
            'Feriado'
          )}
        </TableCell>
      )
    }
    case 'day-off': {
      return <TableCell className="text-muted-foreground">Folga</TableCell>
    }
    case 'excused': {
      return <TableCell className="text-muted-foreground">Abonado</TableCell>
    }
    case 'no-schedule': {
      return <TableCell className="text-muted-foreground">Sem escala</TableCell>
    }
    case 'future': {
      return <TableCell />
    }
  }
}

const WorkedCell = ({ journey }: { journey: TJourney }) => (
  <TableCell className="font-mono tabular-nums">
    <span className="inline-flex items-center gap-1">
      {isCalculated(journey) && formatMinutes(journey.worked)}
      {journey.hasOddPunches && (
        <>
          <TriangleAlert
            aria-hidden="true"
            className="size-4 text-destructive"
          />
          <span className="sr-only">{` (${ODD_PUNCHES_LABEL.toLowerCase()})`}</span>
        </>
      )}
    </span>
  </TableCell>
)

const JustificationsCell = ({
  justifications
}: {
  justifications: TJustificationWithType[]
}) => (
  <TableCell>
    {justifications.length > 0 && (
      <ul className="flex flex-col gap-0.5">
        {justifications.map((justification) => {
          const label = getJustificationLabel(justification)
          return (
            <li key={justification.id}>
              <span aria-hidden="true" title={label}>
                {getJustificationShortLabel(justification)}
              </span>
              <span className="sr-only">{label}</span>
            </li>
          )
        })}
      </ul>
    )}
  </TableCell>
)

export const PunchRecordsTable = ({
  days,
  justifications
}: {
  days: TJourneyDay[]
  justifications: TJustificationWithType[]
}) => {
  const columns = Math.max(
    MIN_PUNCH_COLUMNS,
    ...days.map(({ punchRecords }) => punchRecords.length)
  )
  const hasManualRecords = days.some(({ punchRecords }) =>
    punchRecords.some(({ nsr }) => nsr === null)
  )
  const hasOddPunchDays = days.some(({ journey }) => journey.hasOddPunches)

  return (
    <Table aria-label="Registros de ponto">
      {(hasManualRecords || hasOddPunchDays) && (
        <TableCaption className="text-left">
          <ul className="flex flex-col gap-1">
            {hasManualRecords && <li>* Batida inserida manualmente</li>}
            {hasOddPunchDays && (
              <li className="flex items-center gap-1">
                <TriangleAlert
                  aria-hidden="true"
                  className="size-4 text-destructive"
                />
                {ODD_PUNCHES_LABEL}
              </li>
            )}
          </ul>
        </TableCaption>
      )}
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Dia</TableHead>
          {Array.from({ length: columns }, (_, index) => (
            <TableHead key={index}>{`Batida ${index + 1}`}</TableHead>
          ))}
          <TableHead>Esperado</TableHead>
          <TableHead>Trabalhado</TableHead>
          {BALANCE_COLUMNS.map(({ key, label }) => (
            <TableHead key={key}>{label}</TableHead>
          ))}
          <TableHead>Justificativa</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {days.map(({ date, punchRecords, journey }) => {
          const day = dayjs(date)
          const dayJustifications = justifications.filter((justification) =>
            coversDate(justification, date)
          )
          return (
            <TableRow key={date}>
              <TableCell className="font-mono tabular-nums">
                {day.format('DD/MM/YYYY')}
              </TableCell>
              <TableCell className="capitalize">{day.format('ddd')}</TableCell>
              {Array.from({ length: columns }, (_, index) => (
                <PunchRecordCell key={index} record={punchRecords[index]} />
              ))}
              <ExpectedCell journey={journey} />
              <WorkedCell journey={journey} />
              {BALANCE_COLUMNS.map(({ key }) => (
                <TableCell key={key} className="font-mono tabular-nums">
                  {formatMinutes(journey[key])}
                </TableCell>
              ))}
              <JustificationsCell justifications={dayJustifications} />
              <TableCell>
                <div className="flex justify-end">
                  <DayActionsMenu
                    date={date}
                    justifications={dayJustifications}
                  />
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
