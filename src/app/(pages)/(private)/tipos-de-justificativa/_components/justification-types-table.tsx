import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { JustificationType } from '@/infra/database/types'

import { JustificationTypeSheet } from './justification-type-sheet/justification-type-sheet'
import { RemoveJustificationTypeButton } from './remove-justification-type-button/remove-justification-type-button'
import { getEffectLabel } from './utils'

export const JustificationTypesTable = ({
  types
}: {
  types: JustificationType[]
}) => (
  <Table aria-label="Tipos de justificativa">
    <TableHeader>
      <TableRow>
        <TableHead>Código</TableHead>
        <TableHead>Descrição</TableHead>
        <TableHead>Efeito</TableHead>
        <TableHead>
          <span className="sr-only">Ações</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {types.map((type) => (
        <TableRow key={type.id}>
          <TableHead scope="row" className="font-mono font-normal">
            {type.code}
          </TableHead>
          <TableCell>{type.description}</TableCell>
          <TableCell>{getEffectLabel(type.effect)}</TableCell>
          <TableCell>
            <div className="flex justify-end gap-1">
              <JustificationTypeSheet
                type={type}
                defaultValues={{
                  id: type.id,
                  code: type.code,
                  description: type.description,
                  effect: type.effect
                }}
              />
              <RemoveJustificationTypeButton type={type} />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
