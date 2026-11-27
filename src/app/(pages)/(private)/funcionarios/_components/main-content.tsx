import Link from 'next/link'

import { Header } from '@/app/components/blocks/header'
import {
  type TUsersFilterValues,
  UsersFilter
} from '@/app/components/blocks/users-filter'
import { MainContent as _MainContent } from '@/app/components/ui/custom/main-content'
import { Typography } from '@/app/components/ui/custom/typography'
import type {
  JobFunction,
  ShiftAssignment,
  TShiftPatternWithVersions,
  UserGroup
} from '@/infra/database/types'
import type { TUserWithOrganization } from '@/models/user/types'

import { UsersTable } from './users-table'

export const MainContent = ({
  users,
  total,
  positions,
  groups,
  jobFunctions,
  filters,
  shiftPatterns,
  assignments,
  today,
  canEdit
}: {
  users: TUserWithOrganization[]
  total: number
  positions: string[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  filters: TUsersFilterValues
  shiftPatterns: TShiftPatternWithVersions[]
  assignments: ShiftAssignment[]
  today: string
  canEdit: boolean
}) => (
  <>
    <Header title="Funcionários" />
    <_MainContent className="flex flex-col gap-6">
      {total > 0 ? (
        <>
          <UsersFilter
            path="/funcionarios"
            positions={positions}
            groups={groups}
            jobFunctions={jobFunctions}
            filters={filters}
          />
          {users.length > 0 ? (
            <UsersTable
              users={users}
              groups={groups}
              jobFunctions={jobFunctions}
              shiftPatterns={shiftPatterns}
              assignments={assignments}
              today={today}
              canEdit={canEdit}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum funcionário encontrado com esses filtros
            </p>
          )}
        </>
      ) : (
        <div>
          <Typography component="p" variant="h6">
            Nenhum funcionário encontrado
          </Typography>
          {canEdit && (
            <Typography component="p" variant="base">
              Importe os funcionários do dispositivo em{' '}
              <Link
                href="/registros-de-ponto"
                className="underline underline-offset-4"
              >
                Registros de Ponto
              </Link>
            </Typography>
          )}
        </div>
      )}
    </_MainContent>
  </>
)
