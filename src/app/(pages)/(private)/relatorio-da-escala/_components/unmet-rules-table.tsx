import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getRestRestrictionLabel } from '@/app/utils/rest-restriction'
import { CONSTRAINT_LABELS } from '@/app/utils/rest-rule'
import type { TUnmetRule } from '@/models/schedule-report/utils'

import { formatDates, PRINTED_TABLE_CONTAINER } from './utils'

const getLabel = (rule: TUnmetRule): string =>
  rule.kind === 'constraint'
    ? `${rule.ruleName}: ${CONSTRAINT_LABELS[rule.constraint]}`
    : getRestRestrictionLabel(rule.restriction)

export const UnmetRulesTable = ({
  rules,
  labelledBy
}: {
  rules: TUnmetRule[]
  labelledBy: string
}) => (
  <Table aria-labelledby={labelledBy} containerProps={PRINTED_TABLE_CONTAINER}>
    <TableHeader>
      <TableRow>
        <TableHead>Regra</TableHead>
        <TableHead className="text-right">Dias</TableHead>
        <TableHead>Quando</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {rules.map((rule) => (
        <TableRow
          key={
            rule.kind === 'constraint'
              ? `${rule.ruleName}-${rule.constraint}`
              : rule.restriction.id
          }
        >
          <TableHead scope="row" className="font-normal whitespace-normal">
            {getLabel(rule)}
          </TableHead>
          <TableCell className="text-right tabular-nums">
            {rule.dates.length}
          </TableCell>
          <TableCell className="whitespace-normal tabular-nums">
            {formatDates(rule.dates)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
