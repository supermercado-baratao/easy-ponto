import type { TVacationMonth } from '@/models/vacation-plan/types'

import { getMonthLabel } from './utils'

export const MonthsOverview = ({
  year,
  months
}: {
  year: number
  months: TVacationMonth[]
}) => (
  <section
    aria-labelledby="months-overview-title"
    className="flex flex-col gap-3"
  >
    <h3 id="months-overview-title" className="text-sm font-medium">
      Férias de {year} por mês
    </h3>
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map(({ month, users }) => {
        const titleId = `month-${month}-title`
        return (
          <li
            key={month}
            aria-labelledby={titleId}
            className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-card-foreground"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h4 id={titleId} className="text-sm font-medium">
                {getMonthLabel(month)}
              </h4>
              <span className="text-xs text-muted-foreground tabular-nums">
                {users.length === 1
                  ? '1 funcionário'
                  : `${users.length} funcionários`}
              </span>
            </div>
            {users.length > 0 ? (
              <ul className="flex flex-col gap-1 text-sm">
                {users.map((user) => (
                  <li key={user.id}>{user.name}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Ninguém de férias</p>
            )}
          </li>
        )
      })}
    </ol>
  </section>
)
