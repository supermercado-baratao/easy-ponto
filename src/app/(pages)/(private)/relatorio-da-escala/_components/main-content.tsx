import { CalendarX2 } from 'lucide-react'
import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import { PageMessage } from '@/app/components/blocks/page-message'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'

import { AttentionPoints } from './attention-points'
import { EmployeesTable } from './employees-table'
import { GroupWorstDaysTable } from './group-worst-days-table'
import { Indicators } from './indicators'
import { ManagementSummary } from './management-summary'
import { MonthsTable } from './months-table'
import { PeriodFilter } from './period-filter'
import { PresenceTable } from './presence-table'
import { PrintButton } from './print-button'
import { ReportSection } from './report-section'
import type { TScheduleReportPageData } from './types'
import { UnmetRulesTable } from './unmet-rules-table'
import { formatMonth, getGroupName } from './utils'
import { VersionNavigation } from './version-navigation'
import { WeekdayRestsTable } from './weekday-rests-table'

const getPeriodLabel = ({
  initialMonth,
  finalMonth
}: TScheduleReportPageData['period']): string =>
  initialMonth === finalMonth
    ? formatMonth(initialMonth)
    : `${formatMonth(initialMonth)} a ${formatMonth(finalMonth)}`

const FullReport = ({
  report,
  period
}: Pick<TScheduleReportPageData, 'report' | 'period'>) => (
  <>
    <Indicators indicators={report.indicators} />
    <ReportSection id="months" title="Folgas de cada mês">
      <MonthsTable
        months={report.months}
        limit={period.limit}
        labelledBy="months"
      />
    </ReportSection>
    <ReportSection
      id="rests"
      title="Folgas do ciclo por dia da semana"
      description="Média de pessoas de folga em cada dia da semana, pelas folgas da escala, antes de movê-las."
    >
      <WeekdayRestsTable rests={report.rests} labelledBy="rests" />
    </ReportSection>
    {report.groupWorstDays.length > 0 && (
      <ReportSection
        id="group-worst-days"
        title="Pior dia de cada grupo"
        description="O dia com mais pessoas do grupo de folga, contando os grupos dentro dele."
      >
        <GroupWorstDaysTable
          groups={report.groupWorstDays}
          labelledBy="group-worst-days"
        />
      </ReportSection>
    )}
    {report.hours.length > 0 && (
      <ReportSection
        id="presence"
        title="Presença por horário"
        description="Média de pessoas trabalhando em cada hora, por dia da semana, fora dos feriados."
      >
        <div className="flex flex-col gap-6">
          {report.presence.map(({ groupId, name, rows }) => (
            <div key={String(groupId)} className="flex flex-col gap-2">
              <h3
                id={`presence-${String(groupId)}`}
                className="text-sm font-medium"
              >
                {getGroupName(name)}
              </h3>
              <PresenceTable
                labelledBy={`presence presence-${String(groupId)}`}
                hours={report.hours}
                rows={rows}
              />
            </div>
          ))}
        </div>
      </ReportSection>
    )}
    <ReportSection
      id="unmet-rules"
      title="Regras preferenciais não cumpridas"
      description="As restrições preferenciais das regras que as folgas movidas não cumprem e as restrições preferenciais entre funcionários que as folgas quebram."
    >
      {report.unmetRules.length > 0 ? (
        <UnmetRulesTable rules={report.unmetRules} labelledBy="unmet-rules" />
      ) : (
        <p className="text-sm text-muted-foreground">
          Todas as regras preferenciais foram cumpridas
        </p>
      )}
    </ReportSection>
    <ReportSection
      id="employees"
      title="Funcionários"
      description="O saldo de horas é a diferença de carga que as folgas movidas causam no período."
    >
      <EmployeesTable employees={report.employees} labelledBy="employees" />
    </ReportSection>
  </>
)

export const MainContent = ({
  period,
  version,
  report,
  rules,
  restrictions,
  canEdit
}: TScheduleReportPageData) => (
  <>
    <Header title="Relatório da Escala">
      <PrintButton />
    </Header>
    <_MainContent className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <VersionNavigation period={period} version={version} />
        <PeriodFilter period={period} version={version} />
        <p className="text-sm text-muted-foreground">
          {version === 'management'
            ? 'Resumo para a gerência'
            : 'Relatório completo'}
          {' · '}
          {getPeriodLabel(period)}
        </p>
      </div>
      {report.attentionPoints.length > 0 && (
        <AttentionPoints points={report.attentionPoints} canEdit={canEdit} />
      )}
      {report.indicators.employees > 0 ? (
        version === 'management' ? (
          <ManagementSummary
            report={report}
            rules={rules}
            restrictions={restrictions}
          />
        ) : (
          <FullReport report={report} period={period} />
        )
      ) : (
        <PageMessage
          icon={CalendarX2}
          title="Nenhum funcionário com escala no período"
          titleAs="h2"
          description={
            canEdit ? (
              <>
                Vincule as escalas aos funcionários em{' '}
                <Link
                  href="/funcionarios"
                  className="underline underline-offset-4"
                >
                  Funcionários
                </Link>
              </>
            ) : (
              'Os funcionários ainda não têm escala neste período.'
            )
          }
        />
      )}
    </_MainContent>
  </>
)
