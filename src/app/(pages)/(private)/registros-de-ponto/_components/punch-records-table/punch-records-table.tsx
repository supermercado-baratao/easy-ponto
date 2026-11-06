import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { PunchRecord } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import type { TPunchRecordDay } from '@/models/punch-record/types'

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

export const PunchRecordsTable = ({ days }: { days: TPunchRecordDay[] }) => {
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {days.map(({ date, punchRecords }) => {
          const day = dayjs(date)
          return (
            <TableRow key={date}>
              <TableCell className="font-mono tabular-nums">
                {day.format('DD/MM/YYYY')}
              </TableCell>
              <TableCell className="capitalize">{day.format('ddd')}</TableCell>
              {Array.from({ length: columns }, (_, index) => (
                <PunchRecordCell key={index} record={punchRecords[index]} />
              ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
