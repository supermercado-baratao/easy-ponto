import { minutesToTime } from '@/models/schedule/utils'
import type { TWorkloadCalendar } from '@/models/workload-calendar/types'

export const MonthSummary = ({
  calendar: { workedDays, total, standardJourney, excess }
}: {
  calendar: TWorkloadCalendar
}) => {
  const items = [
    { label: 'Dias trabalhados', value: String(workedDays) },
    { label: 'Carga do mês', value: minutesToTime(total) },
    { label: 'Jornada padrão', value: minutesToTime(standardJourney) },
    { label: 'Excedente', value: minutesToTime(excess) }
  ]
  return (
    <section aria-label="Resumo do mês">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
