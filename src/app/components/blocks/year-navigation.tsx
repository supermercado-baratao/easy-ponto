import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { MAX_YEAR, MIN_YEAR } from '@/constants/year'

export const YearNavigation = ({
  year,
  path
}: {
  year: number
  path: string
}) => (
  <nav aria-label="Ano" className="flex items-center gap-2">
    {year > MIN_YEAR ? (
      <Link
        href={`${path}?ano=${year - 1}`}
        aria-label="Ano anterior"
        className={buttonVariants({ variant: 'outline', size: 'icon' })}
      >
        <ChevronLeft aria-hidden="true" />
      </Link>
    ) : (
      <span aria-hidden="true" className="size-8" />
    )}
    <h2 className="min-w-12 text-center text-base font-medium tabular-nums">
      {year}
    </h2>
    {year < MAX_YEAR ? (
      <Link
        href={`${path}?ano=${year + 1}`}
        aria-label="Próximo ano"
        className={buttonVariants({ variant: 'outline', size: 'icon' })}
      >
        <ChevronRight aria-hidden="true" />
      </Link>
    ) : (
      <span aria-hidden="true" className="size-8" />
    )}
  </nav>
)
