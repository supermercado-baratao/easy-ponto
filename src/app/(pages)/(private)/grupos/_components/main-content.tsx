import { Header } from '@/app/components/blocks/header'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import type { UserGroup } from '@/infra/database/types'

import type { TUserGroupRow } from './types'
import { UserGroupSheet } from './user-group-sheet/user-group-sheet'
import { UserGroupsTable } from './user-groups-table'

export const MainContent = ({
  groups,
  rows,
  canEdit
}: {
  groups: UserGroup[]
  rows: TUserGroupRow[]
  canEdit: boolean
}) => (
  <>
    <Header title="Grupos">
      {canEdit && <UserGroupSheet groups={groups} defaultValues={{}} />}
    </Header>
    <_MainContent className="flex flex-col gap-6">
      {rows.length > 0 ? (
        <UserGroupsTable groups={groups} rows={rows} canEdit={canEdit} />
      ) : (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Nenhum grupo cadastrado</p>
          {canEdit && (
            <p>
              Cadastre os setores e as seções dentro deles e inclua os
              funcionários em Funcionários.
            </p>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
