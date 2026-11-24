import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { JustificationType } from '@/infra/database/types'
import { getEffectLabel } from '@/models/justification-type/utils'

import { JustificationTypeSheet } from './justification-type-sheet/justification-type-sheet'
import { RemoveJustificationTypeButton } from './remove-justification-type-button/remove-justification-type-button'

export const JustificationTypesTable = ({
  types,
  canEdit
}: {
  types: JustificationType[]
  canEdit: boolean
}) => (
  <Table aria-label="Tipos de justificativa">
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Efeito</TableHead>
        {canEdit && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {types.map((type) => (
        <TableRow key={type.id}>
          <TableHead scope="row" className="font-normal">
            {type.name}
          </TableHead>
          <TableCell>{getEffectLabel(type.effect)}</TableCell>
          {canEdit && (
            <TableCell>
              <div className="flex justify-end gap-1">
                <JustificationTypeSheet
                  type={type}
                  defaultValues={{
                    id: type.id,
                    name: type.name,
                    effect: type.effect
                  }}
                />
                <RemoveJustificationTypeButton type={type} />
              </div>
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
