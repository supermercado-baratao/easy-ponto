import type { TJourneyTotals } from '@/models/journey/types'
import { minutesToTime } from '@/models/schedule/utils'

const TOTALS = [
  { key: 'expected', label: 'Esperado' },
  { key: 'worked', label: 'Trabalhado' },
  { key: 'absence', label: 'Faltas' },
  { key: 'lateness', label: 'Atrasos' },
  { key: 'compensation', label: 'Compensações' },
  { key: 'overtime60', label: 'Extra 60%' },
  { key: 'overtime100', label: 'Extra 100%' }
] as const

export const MonthTotals = ({ totals }: { totals: TJourneyTotals }) => (
  <section aria-labelledby="month-totals-title" className="flex flex-col gap-3">
    <h3 id="month-totals-title" className="text-base font-medium">
      Totais do mês
    </h3>
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {TOTALS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col gap-1 rounded-lg border p-3 last:col-span-2 sm:last:col-span-1"
        >
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="font-mono text-lg tabular-nums">
            {minutesToTime(totals[key])}
          </dd>
        </div>
      ))}
    </dl>
  </section>
)
