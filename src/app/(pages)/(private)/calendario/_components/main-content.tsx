import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import { MonthNavigation } from '@/app/components/blocks/month-navigation'
import { UsersFilter } from '@/app/components/blocks/users-filter'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'

import { MonthGrid } from './month-grid'
import { MonthSummary } from './month-summary'
import { SelectedUserHeading } from './selected-user-heading'
import { SummaryTable } from './summary-table'
import type {
  TCalendarFilters,
  TCalendarRow,
  TCalendarUserMonthView
} from './types'
import { CALENDAR_PATH, getFilterQuery } from './utils'

export const MainContent = ({
  month,
  rows,
  selected,
  total,
  positions,
  filters,
  canEdit
}: {
  month: string
  rows: TCalendarRow[]
  selected: TCalendarUserMonthView | null
  total: number
  positions: string[]
  filters: TCalendarFilters
  canEdit: boolean
}) => (
  <>
    <Header title="Calendário" />
    <_MainContent className="flex flex-col gap-6">
      <MonthNavigation
        month={month}
        path={CALENDAR_PATH}
        query={{ ...getFilterQuery(filters), funcionario: filters.userId }}
      />
      {total > 0 ? (
        <>
          {selected && (
            <section
              aria-labelledby="selected-user"
              className="flex flex-col gap-4"
            >
              <SelectedUserHeading
                id="selected-user"
                userId={selected.user.id}
                name={selected.user.name}
              />
              <MonthSummary summary={selected.summary} />
              <MonthGrid selection={selected} canEdit={canEdit} />
            </section>
          )}
          <section aria-labelledby="employees" className="flex flex-col gap-4">
            <h3 id="employees" className="text-base font-medium">
              Funcionários
            </h3>
            <UsersFilter
              path={CALENDAR_PATH}
              positions={positions}
              filters={filters}
            >
              <input type="hidden" name="mes" value={month} />
              {filters.userId && (
                <input
                  type="hidden"
                  name="funcionario"
                  value={filters.userId}
                />
              )}
            </UsersFilter>
            {rows.length > 0 ? (
              <SummaryTable month={month} rows={rows} filters={filters} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum funcionário encontrado com esses filtros
              </p>
            )}
          </section>
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhum funcionário encontrado
          </Typography>
          {canEdit && (
            <Typography component="p" variant="base">
              Importe os funcionários do dispositivo em{' '}
              <Link
                href="/registros-de-ponto"
                className="underline underline-offset-4"
              >
                Registros de Ponto
              </Link>
            </Typography>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
