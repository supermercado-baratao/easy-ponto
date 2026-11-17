import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'

const TIMELINE_START = 6 * 60
const TIMELINE_LENGTH = 12 * 60

type TPreviewDay = {
  day: string
  punches: string[]
  worked: string
  balance: string
  note?: string
}

const days: TPreviewDay[] = [
  {
    day: 'Seg',
    punches: ['07:27', '11:32', '13:01', '16:49'],
    worked: '7:53',
    balance: '+0:33'
  },
  {
    day: 'Ter',
    punches: ['07:30', '11:30', '12:58', '16:20'],
    worked: '7:22',
    balance: '+0:02'
  },
  {
    day: 'Qua',
    punches: ['07:58', '11:31', '13:02', '16:45'],
    worked: '7:16',
    balance: '−0:04'
  },
  {
    day: 'Qui',
    punches: ['07:29', '11:35', '13:00', '17:40'],
    worked: '8:46',
    balance: '+1:26'
  },
  {
    day: 'Sex',
    punches: [],
    worked: '',
    balance: '',
    note: 'Feriado'
  }
]

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const toPercent = (minutes: number): string =>
  `${((minutes - TIMELINE_START) / TIMELINE_LENGTH) * 100}%`

const DayTimeline = ({ punches }: { punches: string[] }) => {
  const intervals = []
  for (let index = 0; index + 1 < punches.length; index += 2) {
    const start = toMinutes(punches[index])
    const end = toMinutes(punches[index + 1])
    intervals.push({ start, end })
  }

  return (
    <div aria-hidden className="relative h-2 rounded-full bg-muted">
      {intervals.map(({ start, end }) => (
        <span
          key={start}
          className="absolute inset-y-0 rounded-full bg-primary"
          style={{
            left: toPercent(start),
            width: `${((end - start) / TIMELINE_LENGTH) * 100}%`
          }}
        />
      ))}
    </div>
  )
}

export const TimeCardPreview = () => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <Table className="caption-top tabular-nums">
        <TableCaption className="mt-0 border-b px-4 py-3 text-left font-medium text-foreground">
          Cartão de ponto de exemplo
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead
              scope="col"
              className="px-4 text-xs font-normal text-muted-foreground"
            >
              Dia
            </TableHead>
            <TableHead
              scope="col"
              className="text-xs font-normal text-muted-foreground"
            >
              Batidas
            </TableHead>
            <TableHead
              scope="col"
              className="text-right text-xs font-normal text-muted-foreground"
            >
              Trabalhadas
            </TableHead>
            <TableHead
              scope="col"
              className="px-4 text-right text-xs font-normal text-muted-foreground"
            >
              Saldo
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {days.map(({ day, punches, worked, balance, note }) => (
            <TableRow key={day}>
              <TableHead scope="row" className="px-4 py-3">
                {day}
              </TableHead>
              <TableCell className="w-full py-3 whitespace-normal">
                {note ? (
                  <span className="text-muted-foreground">{note}</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground">
                      {punches.join(' ')}
                    </span>
                    <DayTimeline punches={punches} />
                  </div>
                )}
              </TableCell>
              <TableCell className="py-3 text-right">{worked}</TableCell>
              <TableCell className="px-4 py-3 text-right font-medium">
                {balance}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead scope="row" colSpan={3} className="px-4 py-3">
              Saldo da semana
            </TableHead>
            <TableCell className="px-4 py-3 text-right font-semibold">
              +1:57
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
