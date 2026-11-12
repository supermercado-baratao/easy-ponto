import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type { JustificationType } from '@/infra/database/types'

import { JustificationTypeSheet } from './justification-type-sheet/justification-type-sheet'
import { JustificationTypesTable } from './justification-types-table'

export const MainContent = ({
  hasCompany,
  types
}: {
  hasCompany: boolean
  types: JustificationType[]
}) => (
  <>
    <Header title="Tipos de Justificativa">
      {hasCompany && <JustificationTypeSheet defaultValues={{}} />}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {hasCompany ? (
        types.length > 0 ? (
          <JustificationTypesTable types={types} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhum tipo de justificativa cadastrado
          </p>
        )
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhuma empresa encontrada
          </Typography>
          <Typography component="p" variant="base">
            Importe a empresa em Configurações para cadastrar os tipos de
            justificativa
          </Typography>
        </div>
      )}
    </_MainContent>
  </>
)
