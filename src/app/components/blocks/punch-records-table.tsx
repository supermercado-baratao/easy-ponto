import { cn } from 'cn'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import {
  getJustificationLabel,
  getJustificationShortLabel
} from '@/app/utils/justification'
import { getOvertimeLabel } from '@/app/utils/overtime'
import type {
  PunchRecord,
  TJustificationWithType
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { minutesToTime } from '@/infra/time'
import type { TJourney, TJourneyDay } from '@/models/journey/types'
import { getOvertimeMinutes, isCalculated } from '@/models/journey/utils'
import { coversDate } from '@/models/justification/utils'

// Four punches (two entries and two exits) are the usual day, so the columns never shrink below it
const MIN_PUNCH_COLUMNS = 4

// The date stays on screen while the other columns scroll on phones (#90). The row's hover color is
// layered as an image, since the cell needs an opaque background to hide what scrolls under it
const STICKY_COLUMN_CLASS_NAME =
  'sticky left-0 z-10 bg-background shadow-[inset_-1px_0_0_var(--color-border)] in-[tr:is(:hover,:has([aria-expanded=true]))]:bg-linear-to-r in-[tr:is(:hover,:has([aria-expanded=true]))]:from-muted/50 in-[tr:is(:hover,:has([aria-expanded=true]))]:to-muted/50'

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
  { key: 'compensation', label: 'Compensação' }
] as const

const ODD_PUNCHES_LABEL = 'Número ímpar de batidas'

const formatMinutes = (minutes: number): string =>
  minutes === 0 ? '' : minutesToTime(minutes)

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
  justifications,
  overtimePercentages,
  labelledBy,
  renderActions
}: {
  days: TJourneyDay[]
  justifications: TJustificationWithType[]
  overtimePercentages: number[]
  labelledBy?: string
  renderActions?: (
    date: string,
    justifications: TJustificationWithType[]
  ) => ReactNode
}) => {
  const columns = Math.max(
    MIN_PUNCH_COLUMNS,
    ...days.map(({ punchRecords }) => punchRecords.length)
  )
  const hasManualRecords = days.some(({ punchRecords }) =>
    punchRecords.some(({ nsr }) => nsr === null)
  )
  const hasOddPunchDays = days.some(({ journey }) => journey.hasOddPunches)
  const name = labelledBy
    ? { 'aria-labelledby': labelledBy }
    : { 'aria-label': 'Registros de ponto' }

  return (
    <Table
      {...name}
      containerProps={{
        ...name,
        role: 'region',
        tabIndex: 0,
        className:
          'rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
      }}
    >
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
          <TableHead className={STICKY_COLUMN_CLASS_NAME}>Data</TableHead>
          <TableHead>Dia</TableHead>
          {Array.from({ length: columns }, (_, index) => (
            <TableHead key={index}>{`Batida ${index + 1}`}</TableHead>
          ))}
          <TableHead>Esperado</TableHead>
          <TableHead>Trabalhado</TableHead>
          {BALANCE_COLUMNS.map(({ key, label }) => (
            <TableHead key={key}>{label}</TableHead>
          ))}
          {overtimePercentages.map((percentage) => (
            <TableHead key={percentage}>
              {getOvertimeLabel(percentage)}
            </TableHead>
          ))}
          <TableHead>Justificativa</TableHead>
          {renderActions && (
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          )}
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
              <TableCell
                className={cn(
                  'font-mono tabular-nums',
                  STICKY_COLUMN_CLASS_NAME
                )}
              >
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
              {overtimePercentages.map((percentage) => (
                <TableCell key={percentage} className="font-mono tabular-nums">
                  {formatMinutes(
                    getOvertimeMinutes(journey.overtime, percentage)
                  )}
                </TableCell>
              ))}
              <JustificationsCell justifications={dayJustifications} />
              {renderActions && (
                <TableCell>
                  <div className="flex justify-end">
                    {renderActions(date, dayJustifications)}
                  </div>
                </TableCell>
              )}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
