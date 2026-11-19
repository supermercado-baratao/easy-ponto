import { Header } from '@/app/components/blocks/header'
import { YearNavigation } from '@/app/components/blocks/year-navigation'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type { JustificationType } from '@/infra/database/types'
import type {
  TVacationMonth,
  TVacationPlanRow
} from '@/models/vacation-plan/types'

import { MonthsOverview } from './months-overview'
import { VacationPlansTable } from './vacation-plans-table'

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
  year,
  rows,
  months,
  types
}: {
  year: number
  rows: TVacationPlanRow[]
  months: TVacationMonth[]
  types: JustificationType[]
}) => (
  <>
    <Header title="Férias" />
    <_MainContent className="flex flex-col gap-6">
      <YearNavigation year={year} path="/ferias" />
      {rows.length > 0 ? (
        <>
          <MonthsOverview year={year} months={months} />
          <VacationPlansTable year={year} rows={rows} types={types} />
        </>
      ) : (
        <EmptyState
          title="Nenhum funcionário encontrado"
          description="Importe os funcionários em Configurações para planejar as férias"
        />
      )}
    </_MainContent>
  </>
)
