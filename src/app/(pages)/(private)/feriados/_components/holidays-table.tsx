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
import { RemoveHolidayButton } from './remove-holiday-button/remove-holiday-button'
import { getScopeLabel } from './utils'

export const HolidaysTable = ({
  year,
  holidays
}: {
  year: number
  holidays: THolidayInYear[]
}) => (
  <Table aria-label={`Feriados de ${year}`}>
    <TableHeader>
      <TableRow>
        <TableHead>Data</TableHead>
        <TableHead>Dia</TableHead>
        <TableHead>Nome</TableHead>
        <TableHead>Abrangência</TableHead>
        <TableHead>Repetição</TableHead>
        <TableHead>
          <span className="sr-only">Ações</span>
        </TableHead>
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
            <TableCell>
              {holiday.recurring ? 'Todo ano' : 'Só neste ano'}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <HolidaySheet
                  holiday={holiday}
                  defaultValues={{
                    id: holiday.id,
                    date: holiday.dateInYear,
                    name: holiday.name,
                    scope: holiday.scope,
                    recurring: holiday.recurring ? 'on' : undefined
                  }}
                />
                <RemoveHolidayButton holiday={holiday} />
              </div>
            </TableCell>
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
