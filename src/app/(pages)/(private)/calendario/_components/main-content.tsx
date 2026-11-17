import { Header } from '@/app/components/blocks/header'
import { MonthNavigation } from '@/app/components/blocks/month-navigation'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type { TWorkloadCalendar } from '@/models/workload-calendar/types'

import { CalendarTable } from './calendar-table'
import { MonthSummary } from './month-summary'

export const MainContent = ({
  month,
  calendar
}: {
  month: string
  calendar: TWorkloadCalendar | null
}) => (
  <>
    <Header title="Calendário" />
    <_MainContent className="flex flex-col gap-6">
      {calendar ? (
        <>
          <MonthNavigation month={month} path="/calendario" />
          <MonthSummary calendar={calendar} />
          <CalendarTable calendar={calendar} />
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhuma empresa encontrada
          </Typography>
          <Typography component="p" variant="base">
            Importe a empresa em Configurações para planejar o calendário
          </Typography>
        </div>
      )}
    </_MainContent>
  </>
)
