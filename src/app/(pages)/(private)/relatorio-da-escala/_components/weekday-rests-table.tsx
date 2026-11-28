import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getWeekdayLabel } from '@/app/utils/weekday'
import { WEEKDAYS } from '@/constants/time'
import type { TWeekdayRests } from '@/models/schedule-report/utils'

import { formatAverage, getGroupName, PRINTED_TABLE_CONTAINER } from './utils'

export const WeekdayRestsTable = ({
  rests,
  labelledBy
}: {
  rests: TWeekdayRests[]
  labelledBy: string
}) => (
  <Table aria-labelledby={labelledBy} containerProps={PRINTED_TABLE_CONTAINER}>
    <TableHeader>
      <TableRow>
        <TableHead>Grupo</TableHead>
        <TableHead className="text-right">Pessoas</TableHead>
        {WEEKDAYS.map(({ weekday }) => (
          <TableHead key={weekday} className="text-right">
            {getWeekdayLabel(weekday)}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rests.map(({ groupId, name, members, weekdays }) => (
        <TableRow key={String(groupId)}>
          <TableHead
            scope="row"
            className={name ? 'font-normal whitespace-normal' : undefined}
          >
            {getGroupName(name)}
          </TableHead>
          <TableCell className="text-right tabular-nums">{members}</TableCell>
          {weekdays.map(({ weekday, average }) => (
            <TableCell key={weekday} className="text-right tabular-nums">
              {formatAverage(average)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
