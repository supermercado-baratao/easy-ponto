import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { REST_RESTRICTION_KIND_LABELS } from '@/app/utils/rest-restriction'
import type { TRestRestrictionWithRelations } from '@/infra/database/types'
import type { TRestRestrictionKind } from '@/models/rest-restriction/utils'
import type { TRestConstraintLevel } from '@/models/rest-rule/utils'

import { RemoveRestRestrictionButton } from './remove-rest-restriction-button/remove-rest-restriction-button'
import { RestRestrictionSheet } from './rest-restriction-sheet/rest-restriction-sheet'
import type { TRestRestrictionFormValues } from './rest-restriction-sheet/types'
import type { TGroupOption, TUserOption } from './types'
import { getRestrictionLabel, LEVEL_LABELS } from './utils'

const toFormValues = (
  restriction: TRestRestrictionWithRelations
): TRestRestrictionFormValues => ({
  id: restriction.id,
  kind: restriction.kind,
  level: restriction.level,
  maxOff: restriction.maxOff === null ? '' : String(restriction.maxOff),
  userGroupId: restriction.userGroupId ?? '',
  userId: restriction.userId ?? '',
  userIds: restriction.users.map(({ userId }) => userId),
  weekdays: restriction.weekdays.map(String)
})

// A dismissed employee keeps the restrictions saved before, but is offered only in their own
const getUserOptions = (
  restriction: TRestRestrictionWithRelations,
  users: TUserOption[]
): TUserOption[] => {
  const members = [
    ...restriction.users.map(({ user }) => user),
    ...(restriction.user ? [restriction.user] : [])
  ]
  const missing = members
    .filter(({ id }) => users.every((user) => user.id !== id))
    .map(({ id, name }) => ({ id, name }))
  return [...users, ...missing].toSorted((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  )
}

export const RestRestrictionsTable = ({
  restrictions,
  users,
  groups,
  canEdit
}: {
  restrictions: TRestRestrictionWithRelations[]
  users: TUserOption[]
  groups: TGroupOption[]
  canEdit: boolean
}) => (
  <Table aria-labelledby="rest-restrictions-title">
    <TableHeader>
      <TableRow>
        <TableHead>Restrição</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Nível</TableHead>
        {canEdit && (
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
    <TableBody>
      {restrictions.map((restriction) => {
        const label = getRestrictionLabel(restriction, groups)
        return (
          <TableRow key={restriction.id}>
            <TableHead scope="row" className="font-normal whitespace-normal">
              {label}
            </TableHead>
            <TableCell>
              {
                REST_RESTRICTION_KIND_LABELS[
                  restriction.kind as TRestRestrictionKind
                ]
              }
            </TableCell>
            <TableCell>
              {LEVEL_LABELS[restriction.level as TRestConstraintLevel]}
            </TableCell>
            {canEdit && (
              <TableCell>
                <div className="flex justify-end gap-1">
                  <RestRestrictionSheet
                    label={label}
                    users={getUserOptions(restriction, users)}
                    groups={groups}
                    defaultValues={toFormValues(restriction)}
                  />
                  <RemoveRestRestrictionButton
                    id={restriction.id}
                    label={label}
                  />
                </div>
              </TableCell>
            )}
          </TableRow>
        )
      })}
    </TableBody>
  </Table>
)
