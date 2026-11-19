import {
  ADMIN_ROLE,
  EMPLOYEE_ROLE,
  OWNER_ROLE,
  VIEWER_ROLE
} from '@/models/account/utils'

import type { TMemberActor } from './types'

// The owner is never assigned: the role only moves to another member through the transfer, so the
// company always has exactly one owner
export const ASSIGNABLE_ROLES = [ADMIN_ROLE, VIEWER_ROLE] as const

export const isMemberRole = (role: string): boolean => role !== EMPLOYEE_ROLE

export const getAssignableRoles = (actorRole: string): string[] => {
  if (actorRole === OWNER_ROLE) return [...ASSIGNABLE_ROLES]
  if (actorRole === ADMIN_ROLE) return [VIEWER_ROLE]
  return []
}

export const canManageMember = (
  actor: TMemberActor,
  member: { userId: string; role: string }
): boolean =>
  actor.userId !== member.userId &&
  getAssignableRoles(actor.role).includes(member.role)

export const canTransferOwnership = (
  actor: TMemberActor,
  member: { userId: string; role: string }
): boolean => actor.role === OWNER_ROLE && canManageMember(actor, member)
