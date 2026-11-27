import { minutesToTime } from '@/infra/time'
import type { TCalendarSummary } from '@/models/workload-calendar/types'

export const MonthSummary = ({
  summary: { workdays, daysOff, holidays, adjustments, workload }
}: {
  summary: TCalendarSummary
}) => {
  const items = [
    { label: 'Dias de trabalho', value: String(workdays) },
    { label: 'Folgas', value: String(daysOff) },
    { label: 'Feriados', value: String(holidays) },
    { label: 'Ajustes', value: String(adjustments) },
    { label: 'Carga do mês', value: minutesToTime(workload) }
  ]
  return (
    <section
      aria-labelledby="month-summary-title"
      className="flex flex-col gap-3"
    >
      <h4 id="month-summary-title" className="text-sm font-medium">
        Resumo do mês
      </h4>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-lg border bg-card p-3 text-card-foreground"
          >
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-mono text-xl font-medium tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
