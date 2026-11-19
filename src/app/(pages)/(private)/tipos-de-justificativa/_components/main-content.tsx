import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { JustificationType } from '@/infra/database/types'

import { JustificationTypeSheet } from './justification-type-sheet/justification-type-sheet'
import { JustificationTypesTable } from './justification-types-table'

export const MainContent = ({
  types,
  canEdit
}: {
  types: JustificationType[]
  canEdit: boolean
}) => (
  <>
    <Header title="Tipos de Justificativa">
      {canEdit && <JustificationTypeSheet defaultValues={{}} />}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {types.length > 0 ? (
        <JustificationTypesTable types={types} canEdit={canEdit} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum tipo de justificativa cadastrado
        </p>
      )}
    </_MainContent>
  </>
)
