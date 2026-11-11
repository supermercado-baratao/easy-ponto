import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import { buttonVariants } from '@/app/components/ui/shadcn/button'
import type { THolidayInYear } from '@/models/holiday/types'

import { HolidaySheet } from './holiday-sheet/holiday-sheet'
import { HolidaysTable } from './holidays-table'
import { NationalHolidaysButton } from './national-holidays-button/national-holidays-button'

const YearNavigation = ({ year }: { year: number }) => (
  <nav aria-label="Ano" className="flex items-center gap-2">
    <Link
      href={`/feriados?ano=${year - 1}`}
      aria-label="Ano anterior"
      className={buttonVariants({ variant: 'outline', size: 'icon' })}
    >
      <ChevronLeft aria-hidden="true" />
    </Link>
    <h2 className="min-w-12 text-center text-base font-medium tabular-nums">
      {year}
    </h2>
    <Link
      href={`/feriados?ano=${year + 1}`}
      aria-label="Próximo ano"
      className={buttonVariants({ variant: 'outline', size: 'icon' })}
    >
      <ChevronRight aria-hidden="true" />
    </Link>
  </nav>
)

export const MainContent = ({
  hasCompany,
  year,
  holidays
}: {
  hasCompany: boolean
  year: number
  holidays: THolidayInYear[]
}) => (
  <>
    <Header title="Feriados">
      {hasCompany && <HolidaySheet defaultValues={{ date: `${year}-01-01` }} />}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {hasCompany ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <YearNavigation year={year} />
            <NationalHolidaysButton year={year} />
          </div>
          {holidays.length > 0 ? (
            <HolidaysTable year={year} holidays={holidays} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum feriado cadastrado em {year}
            </p>
          )}
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhuma empresa encontrada
          </Typography>
          <Typography component="p" variant="base">
            Importe a empresa em Configurações para cadastrar os feriados
          </Typography>
        </div>
      )}
    </_MainContent>
  </>
)
