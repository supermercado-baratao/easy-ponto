import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/app/components/ui/shadcn/button'

export const YearNavigation = ({
  year,
  path
}: {
  year: number
  path: string
}) => (
  <nav aria-label="Ano" className="flex items-center gap-2">
    <Link
      href={`${path}?ano=${year - 1}`}
      aria-label="Ano anterior"
      className={buttonVariants({ variant: 'outline', size: 'icon' })}
    >
      <ChevronLeft aria-hidden="true" />
    </Link>
    <h2 className="min-w-12 text-center text-base font-medium tabular-nums">
      {year}
    </h2>
    <Link
      href={`${path}?ano=${year + 1}`}
      aria-label="Próximo ano"
      className={buttonVariants({ variant: 'outline', size: 'icon' })}
    >
      <ChevronRight aria-hidden="true" />
    </Link>
  </nav>
)
