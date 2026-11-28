import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getRestRestrictionLabel } from '@/app/utils/rest-restriction'
import { CONSTRAINT_LABELS } from '@/app/utils/rest-rule'
import { dayjs } from '@/infra/dayjs'
import type { TRestPreviewMove } from '@/models/rest-rule/types'

const formatDate = (date: string): string => dayjs(date).format('ddd, DD/MM')

const getNote = ({
  reason,
  target,
  unmetConstraints,
  brokenRestrictions
}: TRestPreviewMove): string => {
  if (!target) return 'Nenhum dia cumpre as restrições obrigatórias'
  // The broken restrictions come before the unmet constraints, since they weigh more
  const notes = [
    ...(reason === 'holiday' ? ['O feriado continua de folga'] : []),
    ...brokenRestrictions.map(
      (restriction) => `Quebra: ${getRestRestrictionLabel(restriction)}`
    ),
    ...unmetConstraints.map(
      (constraint) => `Não cumpre: ${CONSTRAINT_LABELS[constraint]}`
    )
  ]
  return notes.join(' · ')
}

export const PreviewTable = ({ moves }: { moves: TRestPreviewMove[] }) => (
  <Table aria-label="Prévia das folgas">
    <TableHeader>
      <TableRow>
        <TableHead>Funcionário</TableHead>
        <TableHead>Folga da escala</TableHead>
        <TableHead>Nova folga</TableHead>
        <TableHead>Observação</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {moves
        .toSorted(
          (a, b) =>
            a.userName.localeCompare(b.userName) || a.date.localeCompare(b.date)
        )
        .map((move) => (
          <TableRow key={`${move.userId}-${move.date}`}>
            <TableHead scope="row" className="font-normal whitespace-normal">
              {move.userName}
            </TableHead>
            <TableCell className="tabular-nums">
              {formatDate(move.date)}
            </TableCell>
            <TableCell className="tabular-nums">
              {move.target ? (
                formatDate(move.target)
              ) : (
                <span className="text-destructive">Não movida</span>
              )}
            </TableCell>
            <TableCell className="whitespace-normal text-muted-foreground">
              {getNote(move)}
            </TableCell>
          </TableRow>
        ))}
    </TableBody>
  </Table>
)
