'use client'

import { Ellipsis } from 'lucide-react'

import { Button } from '@/app/components/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/app/components/ui/shadcn/dropdown-menu'
import type { TMember, TMemberActor } from '@/models/member/types'
import { canTransferOwnership, getAssignableRoles } from '@/models/member/utils'

import { getRoleLabel, getRowActionsId } from '../utils'
import { useMemberActions } from './member-actions-provider'

export const MemberActionsMenu = ({
  member,
  actor
}: {
  member: TMember
  actor: TMemberActor
}) => {
  const { pendingMemberId, changeRole, openTransfer, openRemoval } =
    useMemberActions()
  const roles = getAssignableRoles(actor.role).filter(
    (role) => role !== member.role
  )
  const canTransfer = canTransferOwnership(actor, member)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={getRowActionsId(member.id)}
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ações de ${member.name}`}
            disabled={pendingMemberId === member.id}
            focusableWhenDisabled
          />
        }
      >
        <Ellipsis aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        {(roles.length > 0 || canTransfer) && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="sr-only">Papel</DropdownMenuLabel>
              {roles.map((role) => (
                <DropdownMenuItem
                  key={role}
                  onClick={() => changeRole(member, role)}
                >
                  Tornar {getRoleLabel(role).toLocaleLowerCase('pt-BR')}
                </DropdownMenuItem>
              ))}
              {canTransfer && (
                <DropdownMenuItem onClick={() => openTransfer(member)}>
                  Transferir a propriedade
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => openRemoval(member)}
        >
          Remover da empresa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
