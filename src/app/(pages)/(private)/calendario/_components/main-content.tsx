import { Header } from '@/app/components/blocks/header'
import { MonthNavigation } from '@/app/components/blocks/month-navigation'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { TWorkloadCalendar } from '@/models/workload-calendar/types'

import { CalendarTable } from './calendar-table'
import { MonthSummary } from './month-summary'

export const MainContent = ({
  month,
  calendar
}: {
  month: string
  calendar: TWorkloadCalendar
}) => (
  <>
    <Header title="Calendário" />
    <_MainContent className="flex flex-col gap-6">
      <MonthNavigation month={month} path="/calendario" />
      <MonthSummary calendar={calendar} />
      <CalendarTable calendar={calendar} />
    </_MainContent>
  </>
)
