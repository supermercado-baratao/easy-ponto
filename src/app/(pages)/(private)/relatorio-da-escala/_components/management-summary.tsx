import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getRestRestrictionLabel } from '@/app/utils/rest-restriction'
import {
  getConstraintSummary,
  HOLIDAY_REST_LABELS,
  LEVEL_LABELS
} from '@/app/utils/rest-rule'
import type { TRestRestrictionSummary } from '@/models/rest-restriction/utils'
import type {
  THolidayRestPolicy,
  TRestConstraintLevel
} from '@/models/rest-rule/utils'
import type { TScheduleReport } from '@/models/schedule-report/utils'

import { ReportSection } from './report-section'
import type { TReportRule } from './types'
import { PRINTED_TABLE_CONTAINER } from './utils'
import { WeekdayRestsTable } from './weekday-rests-table'

const DISTANCES_FORMAT = new Intl.ListFormat('pt-BR', {
  style: 'long',
  type: 'conjunction'
})

const getRuleLines = (rule: TReportRule): string[] => [
  `Escalas: ${rule.shiftPatternNames.join(', ') || 'nenhuma'}`,
  `A folga fica entre os dias ${rule.windowStartDay} e ${rule.windowEndDay} do mês; a que cai fora vai para o primeiro dia de trabalho que couber, tentando as distâncias de ${DISTANCES_FORMAT.format(rule.distances.map(String))} dias, nessa ordem`,
  `Feriado no dia da folga: ${HOLIDAY_REST_LABELS[rule.holidayRest as THolidayRestPolicy].toLowerCase()}`,
  ...getConstraintSummary(rule)
]

export const ManagementSummary = ({
  report,
  rules,
  restrictions
}: {
  report: TScheduleReport
  rules: TReportRule[]
  restrictions: TRestRestrictionSummary[]
}) => (
  <>
    <ReportSection id="rules" title="Regras">
      {rules.length === 0 && restrictions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma regra de folga cadastrada
        </p>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          {rules.map((rule) => (
            <div key={rule.id} className="flex flex-col gap-1">
              <h3 className="font-medium">{rule.name}</h3>
              <ul className="flex list-disc flex-col gap-0.5 pl-4">
                {getRuleLines(rule).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
          {restrictions.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">Restrições entre funcionários</h3>
              <ul className="flex list-disc flex-col gap-0.5 pl-4">
                {restrictions.map((restriction) => (
                  <li key={restriction.id}>
                    {`${LEVEL_LABELS[restriction.level as TRestConstraintLevel]}: ${getRestRestrictionLabel(restriction)}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ReportSection>
    <ReportSection id="shift-patterns" title="Escalas">
      <Table
        aria-labelledby="shift-patterns"
        containerProps={PRINTED_TABLE_CONTAINER}
      >
        <TableHeader>
          <TableRow>
            <TableHead>Escala</TableHead>
            <TableHead className="text-right">Pessoas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.shiftPatterns.map(({ name, employees }) => (
            <TableRow key={name}>
              <TableHead scope="row" className="font-normal whitespace-normal">
                {name}
              </TableHead>
              <TableCell className="text-right tabular-nums">
                {employees}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ReportSection>
    <ReportSection
      id="management-rests"
      title="Folgas por grupo e dia da semana"
      description="Média de pessoas de folga em cada dia da semana, pelas folgas do ciclo."
    >
      <WeekdayRestsTable rests={report.rests} labelledBy="management-rests" />
    </ReportSection>
  </>
)
