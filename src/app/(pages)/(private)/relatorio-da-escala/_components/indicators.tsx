import type { TScheduleReport } from '@/models/schedule-report/utils'

import { formatDate } from './utils'

export const Indicators = ({
  indicators: { employees, movedRests, unmovedRests, worstDay }
}: {
  indicators: TScheduleReport['indicators']
}) => {
  const items = [
    { label: 'Funcionários', value: String(employees), detail: null },
    { label: 'Folgas movidas', value: String(movedRests), detail: null },
    { label: 'Folgas sem destino', value: String(unmovedRests), detail: null },
    {
      label: 'Pior dia',
      value: worstDay ? formatDate(worstDay.date) : '—',
      detail: worstDay
        ? `${worstDay.off} ${worstDay.off === 1 ? 'pessoa' : 'pessoas'} de folga`
        : null
    }
  ]
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, detail }) => (
        <div
          key={label}
          className="flex flex-col gap-1 rounded-lg border bg-card p-3 text-card-foreground"
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="font-mono text-xl font-medium tabular-nums">
            {value}
          </dd>
          {detail && (
            <dd className="text-sm text-muted-foreground">{detail}</dd>
          )}
        </div>
      ))}
    </dl>
  )
}
