import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import { getStatusLabel } from '@/app/utils/user-status'
import type {
  JobFunction,
  ShiftAssignment,
  TShiftPatternWithVersions,
  UserGroup
} from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'
import { getUserFunctions } from '@/models/job-function/utils'
import { isInEffect } from '@/models/shift-assignment/utils'
import type { TUserWithOrganization } from '@/models/user/types'
import { getGroupLabel } from '@/models/user-group/utils'

import { ResetPasswordButton } from './reset-password-button/reset-password-button'
import { ShiftAssignmentsSheet } from './shift-assignments-sheet/shift-assignments-sheet'
import { UserSheet } from './user-sheet/user-sheet'

const EMPTY_VALUE = '—'

export const UsersTable = ({
  users,
  groups,
  jobFunctions,
  shiftPatterns,
  assignments,
  today,
  canEdit
}: {
  users: TUserWithOrganization[]
  groups: UserGroup[]
  jobFunctions: JobFunction[]
  shiftPatterns: TShiftPatternWithVersions[]
  assignments: ShiftAssignment[]
  today: string
  canEdit: boolean
}) => {
  const namesById = new Map(shiftPatterns.map(({ id, name }) => [id, name]))
  const getAssignments = (userId: string): ShiftAssignment[] =>
    assignments.filter((assignment) => assignment.userId === userId)
  const getCurrentShiftPatterns = (userId: string): string =>
    getAssignments(userId)
      .filter((assignment) => isInEffect(assignment, today))
      .map(({ shiftPatternId }) => namesById.get(shiftPatternId))
      .filter(Boolean)
      .join(', ') || EMPTY_VALUE
  const getOtherFunctions = (user: TUserWithOrganization): string =>
    getUserFunctions(user, jobFunctions)
      .filter(({ payroll, active }) => !payroll && active)
      .map(({ name }) => name)
      .join(', ') || EMPTY_VALUE
  const getGroups = (user: TUserWithOrganization): string =>
    user.groupIds
      .map((groupId) => getGroupLabel(groups, groupId))
      .toSorted((a, b) => a.localeCompare(b, 'pt-BR'))
      .join(', ') || EMPTY_VALUE

  return (
    <Table aria-label="Funcionários">
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Cargo na folha</TableHead>
          <TableHead>Outras funções</TableHead>
          <TableHead>Grupos</TableHead>
          <TableHead>Departamento</TableHead>
          <TableHead>Admissão</TableHead>
          <TableHead>Escala</TableHead>
          <TableHead>Situação</TableHead>
          {canEdit && (
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableHead scope="row" className="font-normal">
              <Link
                href={`/registros-de-ponto?${new URLSearchParams({ pis: user.pis })}`}
                className="underline-offset-4 hover:underline"
              >
                <span className="sr-only">Registros de ponto de </span>
                {user.name}
              </Link>
            </TableHead>
            <TableCell>
              {user.position || EMPTY_VALUE}
              {user.position && !user.payrollPositionActive && (
                <span className="block text-muted-foreground">Não exerce</span>
              )}
            </TableCell>
            <TableCell>{getOtherFunctions(user)}</TableCell>
            <TableCell>{getGroups(user)}</TableCell>
            <TableCell>{user.department || EMPTY_VALUE}</TableCell>
            <TableCell className="font-mono tabular-nums">
              {user.admissionDate
                ? dayjs(user.admissionDate).format('DD/MM/YYYY')
                : EMPTY_VALUE}
            </TableCell>
            <TableCell>{getCurrentShiftPatterns(user.id)}</TableCell>
            <TableCell>{getStatusLabel(user.status)}</TableCell>
            {canEdit && (
              <TableCell>
                <div className="flex justify-end">
                  <ShiftAssignmentsSheet
                    userId={user.id}
                    name={user.name}
                    assignments={getAssignments(user.id)}
                    shiftPatterns={shiftPatterns}
                    today={today}
                  />
                  {user.authUserId && (
                    <ResetPasswordButton id={user.id} name={user.name} />
                  )}
                  <UserSheet
                    name={user.name}
                    groups={groups}
                    jobFunctions={jobFunctions}
                    defaultValues={{
                      id: user.id,
                      status: user.status,
                      position: user.position ?? '',
                      payrollPositionActive: String(user.payrollPositionActive),
                      groupIds: user.groupIds,
                      jobFunctions: user.jobFunctions,
                      department: user.department ?? '',
                      payrollNumber: user.payrollNumber ?? '',
                      admissionDate: user.admissionDate
                        ? dayjs(user.admissionDate).format('YYYY-MM-DD')
                        : ''
                    }}
                  />
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
