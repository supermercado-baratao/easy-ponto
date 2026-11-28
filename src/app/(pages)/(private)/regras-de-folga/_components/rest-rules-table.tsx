import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import {
  getConstraintSummary,
  HOLIDAY_REST_LABELS
} from '@/app/utils/rest-rule'
import type { TRestRuleWithRelations } from '@/infra/database/types'
import {
  REST_CONSTRAINT_FIELD_NAMES,
  type TRestConstraint,
  type TRestConstraintField
} from '@/models/rest-rule/utils'

import { RemoveRestRuleButton } from './remove-rest-rule-button/remove-rest-rule-button'
import { RestRuleSheet } from './rest-rule-sheet/rest-rule-sheet'
import type { TRestRuleFormValues } from './rest-rule-sheet/types'
import type { TShiftPatternOption } from './types'

const toFormValues = (rule: TRestRuleWithRelations): TRestRuleFormValues => ({
  id: rule.id,
  name: rule.name,
  windowStartDay: String(rule.windowStartDay),
  windowEndDay: String(rule.windowEndDay),
  distances: rule.distances.join(', '),
  holidayRest: rule.holidayRest,
  shiftPatternIds: rule.shiftPatterns.map(
    ({ shiftPatternId }) => shiftPatternId
  ),
  blockedWeekdays: rule.blockedWeekdays.map(String),
  ...(Object.fromEntries(
    rule.constraints.flatMap(({ constraint, level, position }) => {
      const name = REST_CONSTRAINT_FIELD_NAMES[constraint as TRestConstraint]
      return [
        [`${name}Level`, level],
        [`${name}Position`, position === null ? '' : String(position)]
      ]
    })
  ) as Partial<Record<TRestConstraintField, string>>)
})

export const RestRulesTable = ({
  rules,
  shiftPatterns,
  canEdit
}: {
  rules: TRestRuleWithRelations[]
  shiftPatterns: TShiftPatternOption[]
  canEdit: boolean
}) => (
  <Table aria-label="Regras de folga">
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Escalas</TableHead>
        <TableHead>Janela</TableHead>
        <TableHead>Distâncias</TableHead>
        <TableHead>Feriado no dia da folga</TableHead>
        <TableHead>Restrições</TableHead>
        {canEdit && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rules.map((rule) => {
        const constraints = getConstraintSummary(rule)
        return (
          <TableRow key={rule.id}>
            <TableHead scope="row" className="font-normal whitespace-normal">
              {rule.name}
            </TableHead>
            <TableCell className="whitespace-normal">
              {shiftPatterns
                .filter(({ id }) =>
                  rule.shiftPatterns.some(
                    ({ shiftPatternId }) => shiftPatternId === id
                  )
                )
                .map(({ name }) => name)
                .join(', ')}
            </TableCell>
            <TableCell className="tabular-nums">
              {`Dia ${rule.windowStartDay} a ${rule.windowEndDay}`}
            </TableCell>
            <TableCell className="tabular-nums">
              {rule.distances.join(', ')}
            </TableCell>
            <TableCell>
              {
                HOLIDAY_REST_LABELS[
                  rule.holidayRest as keyof typeof HOLIDAY_REST_LABELS
                ]
              }
            </TableCell>
            <TableCell className="whitespace-normal">
              {constraints.length > 0 ? (
                <ul className="flex flex-col gap-0.5">
                  {constraints.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-muted-foreground">Nenhuma</span>
              )}
            </TableCell>
            {canEdit && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <RestRuleSheet
                    rule={rule}
                    rules={rules}
                    shiftPatterns={shiftPatterns}
                    defaultValues={toFormValues(rule)}
                  />
                  <RemoveRestRuleButton rule={rule} />
                </div>
              </TableCell>
            )}
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
