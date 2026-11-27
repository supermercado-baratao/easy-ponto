import { getOvertimeLabel } from '@/app/utils/overtime'
import { minutesToTime } from '@/infra/time'
import type { TJourneyTotals } from '@/models/journey/types'
import { getOvertimeMinutes } from '@/models/journey/utils'

const TOTALS = [
  { key: 'expected', label: 'Esperado' },
  { key: 'worked', label: 'Trabalhado' },
  { key: 'absence', label: 'Faltas' },
  { key: 'lateness', label: 'Atrasos' },
  { key: 'compensation', label: 'Compensações' }
] as const

export const MonthTotals = ({
  totals,
  overtimePercentages
}: {
  totals: TJourneyTotals
  overtimePercentages: number[]
}) => {
  const items = [
    ...TOTALS.map(({ key, label }) => ({ key, label, minutes: totals[key] })),
    ...overtimePercentages.map((percentage) => ({
      key: `overtime-${percentage}`,
      label: getOvertimeLabel(percentage),
      minutes: getOvertimeMinutes(totals.overtime, percentage)
    }))
  ]
  return (
    <section
      aria-labelledby="month-totals-title"
      className="flex flex-col gap-3"
    >
      <h3 id="month-totals-title" className="text-base font-medium">
        Totais do mês
      </h3>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
        {items.map(({ key, label, minutes }) => (
          <div
            key={key}
            className="flex flex-col gap-1 rounded-lg border p-3 odd:last:col-span-2 sm:odd:last:col-span-1"
          >
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-mono text-lg tabular-nums">
              {minutesToTime(minutes)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
