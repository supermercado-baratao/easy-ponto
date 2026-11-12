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
import { coversDate } from '@/models/justification/utils'
import type { TPunchRecordDay } from '@/models/punch-record/types'

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
  days: TPunchRecordDay[]
  justifications: TJustificationWithType[]
}) => {
  const columns = Math.max(
    MIN_PUNCH_COLUMNS,
    ...days.map(({ punchRecords }) => punchRecords.length)
  )
  const hasManualRecords = days.some(({ punchRecords }) =>
    punchRecords.some(({ nsr }) => nsr === null)
  )

  return (
    <Table aria-label="Registros de ponto">
      {hasManualRecords && (
        <TableCaption className="text-left">
          * Batida inserida manualmente
        </TableCaption>
      )}
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Dia</TableHead>
          {Array.from({ length: columns }, (_, index) => (
            <TableHead key={index}>{`Batida ${index + 1}`}</TableHead>
          ))}
          <TableHead>Justificativa</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {days.map(({ date, punchRecords }) => {
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
