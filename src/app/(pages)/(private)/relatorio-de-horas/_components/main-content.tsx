import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import type { THoursBankReport } from '@/models/hours-bank/types'

import { AdjustmentProvider } from './adjustment/adjustment-provider'
import { ClosingSection } from './closing/closing-section'
import { HoursReportTable } from './hours-report-table/hours-report-table'
import { PeriodFilter } from './period-filter/period-filter'
import { formatPeriod, getHoursReportHref } from './utils'

const ORDER_LINKS = [
  { order: 'balance', label: 'Saldo' },
  { order: 'name', label: 'Nome' }
] as const

const EmptyState = ({
  title,
  description
}: {
  title: string
  description: string
}) => (
  <div>
    <Typography component="p" variant="h6">
      {title}
    </Typography>
    <Typography component="p" variant="base">
      {description}
    </Typography>
  </div>
)

export const MainContent = ({
  report
}: {
  report: THoursBankReport | null
}) => (
  <>
    <Header title="Relatório de Horas" />
    <_MainContent className="flex flex-col gap-6">
      {report ? (
        <>
          <PeriodFilter period={report.period} order={report.order} />
          <ClosingSection report={report} />
          {report.rows.length > 0 ? (
            <section aria-label={`Saldos de ${formatPeriod(report.period)}`}>
              <nav
                aria-label="Ordenar por"
                className="mb-2 flex items-center gap-2 text-sm"
              >
                <span aria-hidden="true" className="text-muted-foreground">
                  Ordenar por:
                </span>
                {ORDER_LINKS.map(({ order, label }) => (
                  <Link
                    key={order}
                    href={getHoursReportHref({ ...report.period, order })}
                    aria-current={order === report.order ? 'page' : undefined}
                    className={buttonVariants({
                      variant: order === report.order ? 'secondary' : 'ghost',
                      size: 'sm'
                    })}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <AdjustmentProvider defaultDate={report.period.finalDate}>
                <HoursReportTable
                  rows={report.rows}
                  period={report.period}
                  adjustments={report.adjustments}
                  editable={report.closing === null}
                />
              </AdjustmentProvider>
            </section>
          ) : (
            <EmptyState
              title="Nenhum funcionário encontrado"
              description="Cadastre ou importe funcionários do dispositivo para começar"
            />
          )}
        </>
      ) : (
        <EmptyState
          title="Nenhuma empresa cadastrada"
          description="Cadastre a empresa em Configurações para gerar o relatório"
        />
      )}
    </_MainContent>
  </>
)
