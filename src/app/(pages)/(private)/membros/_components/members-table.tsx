import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/app/components/ui/shadcn/table'
import type { TMember, TMemberActor } from '@/models/member/types'
import { canManageMember } from '@/models/member/utils'

import { MemberActionsMenu } from './member-actions/member-actions-menu'
import { getRoleLabel } from './utils'

export const MembersTable = ({
  members,
  actor
}: {
  members: TMember[]
  actor: TMemberActor
}) => (
  <Table aria-label="Membros">
    <TableHeader>
      <TableRow>
        <TableHead>Nome</TableHead>
        <TableHead>E-mail</TableHead>
        <TableHead>Papel</TableHead>
        <TableHead>
          <span className="sr-only">Ações</span>
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {members.map((member) => (
        <TableRow key={member.id}>
          <TableHead scope="row" className="font-normal">
            {member.name}
            {member.userId === actor.userId && (
              <span className="text-muted-foreground"> (você)</span>
            )}
          </TableHead>
          <TableCell>{member.email}</TableCell>
          <TableCell>{getRoleLabel(member.role)}</TableCell>
          <TableCell>
            <div className="flex justify-end">
              {canManageMember(actor, member) && (
                <MemberActionsMenu member={member} actor={actor} />
              )}
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)
