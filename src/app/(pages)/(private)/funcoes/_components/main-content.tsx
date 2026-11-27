import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'

import { AddPayrollPositionsButton } from './add-payroll-positions-button/add-payroll-positions-button'
import { JobFunctionSheet } from './job-function-sheet/job-function-sheet'
import { JobFunctionsTable } from './job-functions-table'
import type { TJobFunctionRow } from './types'

export const MainContent = ({
  rows,
  missingPositions,
  canEdit
}: {
  rows: TJobFunctionRow[]
  missingPositions: string[]
  canEdit: boolean
}) => (
  <>
    <Header title="Funções">
      {canEdit && (
        <div className="flex gap-2">
          {missingPositions.length > 0 && (
            <AddPayrollPositionsButton positions={missingPositions} />
          )}
          <JobFunctionSheet defaultValues={{ level: '1' }} />
        </div>
      )}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      <p className="max-w-prose text-sm text-muted-foreground">
        O cargo na folha de cada funcionário é o que aparece nos documentos
        legais. As funções organizam o trabalho na loja: um funcionário pode
        exercer outras além do cargo na folha, e a de nível mais alto entre as
        ativas é a principal.
      </p>
      {rows.length > 0 ? (
        <JobFunctionsTable rows={rows} canEdit={canEdit} />
      ) : (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Nenhuma função cadastrada</p>
          {canEdit && (
            <p>
              Cadastre as funções da loja ou comece pelos cargos na folha dos
              funcionários.
            </p>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
