import { cn } from 'cn'
import Link from 'next/link'

import { buttonVariants } from '@/app/components/ui/shadcn/button'
import type { TScheduleReportPeriod } from '@/models/schedule-report/types'

import type { TReportVersion } from './types'
import { getReportHref } from './utils'

const VERSIONS: { version: TReportVersion; label: string }[] = [
  { version: 'full', label: 'Completo' },
  { version: 'management', label: 'Gerência' }
]

export const VersionNavigation = ({
  period,
  version
}: {
  period: TScheduleReportPeriod
  version: TReportVersion
}) => (
  <nav aria-label="Versão do relatório" className="flex gap-1 print:hidden">
    {VERSIONS.map((item) => {
      const current = item.version === version
      return (
        <Link
          key={item.version}
          href={getReportHref(period, item.version)}
          aria-current={current ? 'page' : undefined}
          className={cn(
            buttonVariants({
              variant: current ? 'secondary' : 'ghost',
              size: 'sm'
            })
          )}
        >
          {item.label}
        </Link>
      )
    })}
  </nav>
)
