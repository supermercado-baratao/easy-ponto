import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { dayjs } from '@/infra/dayjs'
import type { THolidayInYear } from '@/models/holiday/types'

import { HolidaySheet } from './holiday-sheet/holiday-sheet'
import type { THolidayFormValues } from './holiday-sheet/types'
import { RemoveHolidayButton } from './remove-holiday-button/remove-holiday-button'
import { getRecurrenceLabel, getScopeLabel } from './utils'

const getFormValues = (holiday: THolidayInYear): THolidayFormValues => ({
  id: holiday.id,
  date: holiday.dateInYear,
  name: holiday.name,
  scope: holiday.scope,
  recurrence: holiday.recurrence,
  easterDays:
    holiday.easterOffset === null
      ? undefined
      : String(Math.abs(holiday.easterOffset)),
  easterSide:
    holiday.easterOffset !== null && holiday.easterOffset < 0
      ? 'before'
      : 'after',
  firstYear: holiday.firstYear?.toString(),
  lastYear: holiday.lastYear?.toString()
})

export const HolidaysTable = ({
  year,
  holidays,
  canEdit
}: {
  year: number
  holidays: THolidayInYear[]
  canEdit: boolean
}) => (
  <Table aria-label={`Feriados de ${year}`}>
    <TableHeader>
      <TableRow>
        <TableHead>Data</TableHead>
        <TableHead>Dia</TableHead>
        <TableHead>Nome</TableHead>
        <TableHead>Abrangência</TableHead>
        <TableHead>Repetição</TableHead>
        {canEdit && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {holidays.map((holiday) => {
        const day = dayjs(holiday.dateInYear)
        return (
          <TableRow key={holiday.id}>
            <TableCell className="font-mono tabular-nums">
              {day.format('DD/MM/YYYY')}
            </TableCell>
            <TableCell className="capitalize">{day.format('ddd')}</TableCell>
            <TableHead scope="row" className="font-normal">
              {holiday.name}
            </TableHead>
            <TableCell>{getScopeLabel(holiday.scope)}</TableCell>
            <TableCell>{getRecurrenceLabel(holiday)}</TableCell>
            {canEdit && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <HolidaySheet
                    year={year}
                    holiday={holiday}
                    defaultValues={getFormValues(holiday)}
                  />
                  <RemoveHolidayButton year={year} holiday={holiday} />
                </div>
              </TableCell>
            )}
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
