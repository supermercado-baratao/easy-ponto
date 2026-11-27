import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { UserGroup } from '@/infra/database/types'
import { getGroupPath } from '@/models/user-group/utils'

import { RemoveUserGroupButton } from './remove-user-group-button/remove-user-group-button'
import type { TUserGroupRow } from './types'
import { UserGroupSheet } from './user-group-sheet/user-group-sheet'

export const UserGroupsTable = ({
  groups,
  rows,
  canEdit
}: {
  groups: UserGroup[]
  rows: TUserGroupRow[]
  canEdit: boolean
}) => (
  <Table aria-label="Grupos">
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Dentro de</TableHead>
        <TableHead className="text-right">Funcionários</TableHead>
        {canEdit && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {rows.map(({ group, members }) => {
        const parents = getGroupPath(groups, group.id).slice(0, -1)
        return (
          <TableRow key={group.id}>
            <TableHead scope="row" className="font-normal">
              {group.name}
            </TableHead>
            <TableCell>
              {parents.length > 0 ? parents.join(' › ') : '—'}
            </TableCell>
            <TableCell className="text-right tabular-nums">{members}</TableCell>
            {canEdit && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <UserGroupSheet
                    group={group}
                    groups={groups}
                    defaultValues={{
                      id: group.id,
                      name: group.name,
                      parentId: group.parentId ?? ''
                    }}
                  />
                  <RemoveUserGroupButton group={group} />
                </div>
              </TableCell>
            )}
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
