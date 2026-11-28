import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { TGroupWorstDay } from '@/models/schedule-report/utils'

import { formatDate, PRINTED_TABLE_CONTAINER } from './utils'

export const GroupWorstDaysTable = ({
  groups,
  labelledBy
}: {
  groups: TGroupWorstDay[]
  labelledBy: string
}) => (
  <Table aria-labelledby={labelledBy} containerProps={PRINTED_TABLE_CONTAINER}>
    <TableHeader>
      <TableRow>
        <TableHead>Grupo</TableHead>
        <TableHead className="text-right">Pessoas</TableHead>
        <TableHead>Pior dia</TableHead>
        <TableHead className="text-right">De folga</TableHead>
        <TableHead className="text-right">Trabalhando</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {groups.map(({ groupId, name, members, worstDay }) => (
        <TableRow key={groupId}>
          <TableHead scope="row" className="font-normal whitespace-normal">
            {name}
          </TableHead>
          <TableCell className="text-right tabular-nums">{members}</TableCell>
          <TableCell className="tabular-nums">
            {worstDay ? formatDate(worstDay.date) : '—'}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {worstDay?.off ?? 0}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {members - (worstDay?.off ?? 0)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
