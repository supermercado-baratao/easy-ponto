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
import type { User } from '@/infra/database/types'
import { dayjs } from '@/infra/dayjs'

import { ResetPasswordButton } from './reset-password-button/reset-password-button'
import { UserSheet } from './user-sheet/user-sheet'

export const UsersTable = ({
  users,
  canEdit
}: {
  users: User[]
  canEdit: boolean
}) => (
  <Table aria-label="Funcionários">
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>Cargo</TableHead>
        <TableHead>Departamento</TableHead>
        <TableHead>Admissão</TableHead>
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
          <TableCell>{user.position || '—'}</TableCell>
          <TableCell>{user.department || '—'}</TableCell>
          <TableCell className="font-mono tabular-nums">
            {user.admissionDate
              ? dayjs(user.admissionDate).format('DD/MM/YYYY')
              : '—'}
          </TableCell>
          <TableCell>{getStatusLabel(user.status)}</TableCell>
          {canEdit && (
            <TableCell>
              <div className="flex justify-end">
                {user.authUserId && (
                  <ResetPasswordButton id={user.id} name={user.name} />
                )}
                <UserSheet
                  name={user.name}
                  defaultValues={{
                    id: user.id,
                    status: user.status,
                    position: user.position ?? '',
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
