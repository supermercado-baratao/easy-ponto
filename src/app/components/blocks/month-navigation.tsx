import type { Dayjs } from 'dayjs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/app/components/ui/shadcn/button'
import { MAX_YEAR, MIN_YEAR } from '@/constants/year'
import { dayjs } from '@/infra/dayjs'

export const MonthNavigation = ({
  month,
  path,
  query = {}
}: {
  month: string
  path: string
  query?: Record<string, string | null>
}) => {
  const getHref = (date: Dayjs): string => {
    const parameters = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value) parameters.set(key, value)
    }
    parameters.set('mes', date.format('YYYY-MM'))
    return `${path}?${parameters}`
  }
  const date = dayjs(`${month}-01`)
  const label = date.format('MMMM [de] YYYY')
  const previous = date.subtract(1, 'month')
  const next = date.add(1, 'month')
  return (
    <nav aria-label="Mês" className="flex items-center gap-2">
      {previous.year() >= MIN_YEAR ? (
        <Link
          href={getHref(previous)}
          aria-label="Mês anterior"
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
        >
          <ChevronLeft aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className="size-8" />
      )}
      <h2 className="min-w-40 text-center text-base font-medium">
        {label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1)}
      </h2>
      {next.year() <= MAX_YEAR ? (
        <Link
          href={getHref(next)}
          aria-label="Próximo mês"
          className={buttonVariants({ variant: 'outline', size: 'icon' })}
        >
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span aria-hidden="true" className="size-8" />
      )}
    </nav>
  )
}
