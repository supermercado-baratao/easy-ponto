import { Header } from '@/app/components/blocks/header'
import { YearNavigation } from '@/app/components/blocks/year-navigation'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { THolidayInYear } from '@/models/holiday/types'

import { HolidaySheet } from './holiday-sheet/holiday-sheet'
import { HolidaysTable } from './holidays-table'
import { NationalHolidaysButton } from './national-holidays-button/national-holidays-button'

export const MainContent = ({
  year,
  holidays
}: {
  year: number
  holidays: THolidayInYear[]
}) => (
  <>
    <Header title="Feriados">
      <HolidaySheet defaultValues={{ date: `${year}-01-01` }} />
    </Header>
    <_MainContent className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <YearNavigation year={year} path="/feriados" />
        <NationalHolidaysButton year={year} />
      </div>
      {holidays.length > 0 ? (
        <HolidaysTable year={year} holidays={holidays} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum feriado cadastrado em {year}
        </p>
      )}
    </_MainContent>
  </>
)
