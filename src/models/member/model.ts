import { hashPassword } from 'better-auth/crypto'
import { z } from 'zod'

import type { TMemberWithUser } from '@/infra/database/types'
import { ValidationError } from '@/infra/errors'
import { ADMIN_ROLE, OWNER_ROLE } from '@/models/account/utils'
import { memberRepository } from '@/repositories/member-repository'

import { addSchema, changeRoleSchema, memberActionSchema } from './schema'
import type {
  TMember,
  TMemberActionData,
  TMemberActor,
  TMemberAddData,
  TMemberChangeRoleData
} from './types'
import {
  canManageMember,
  canTransferOwnership,
  getAssignableRoles,
  isMemberRole
} from './utils'

const toMember = ({ id, userId, role, user }: TMemberWithUser): TMember => ({
  id,
  userId,
  role,
  name: user.name,
  email: user.email
})

const findManyByCompanyId = async (companyId: string): Promise<TMember[]> => {
  const members = await memberRepository.findManyByCompanyId(companyId)
  return members
    .filter(({ role }) => isMemberRole(role))
    .map((member) => toMember(member))
}

const findManageable = async ({
  id,
  companyId,
  actor,
  canManage
}: {
  id: string
  companyId: string
  actor: TMemberActor
  canManage: (actor: TMemberActor, member: TMember) => boolean
}): Promise<TMember> => {
  const saved = await memberRepository.findUniqueById({ id, companyId })
  const member = saved && isMemberRole(saved.role) ? toMember(saved) : null
  if (!member || !canManage(actor, member)) {
    // Another editor may have changed or removed the member since the page loaded
    throw new ValidationError({
      message: 'Não foi possível alterar esse membro',
      action: 'Atualize a página: ele pode ter sido alterado por outra pessoa.'
    })
  }
  return member
}

const add = async (data: TMemberAddData): Promise<void> => {
  const { companyId, actorUserId, actorRole, name, email, role, password } =
    addSchema.parse(data)
  if (!getAssignableRoles(actorRole).includes(role)) {
    throw new Error(`User ${actorUserId} can't add a member as ${role}`)
  }
  const member = await memberRepository.create({
    companyId,
    role,
    user: { name, email, mustChangePassword: true },
    passwordHash: await hashPassword(password)
  })
  if (member) return

  throw new z.ZodError([
    {
      code: 'custom',
      path: ['email'],
      message: 'Esse e-mail já é de um membro da empresa',
      input: email
    }
  ])
}

const changeRole = async (data: TMemberChangeRoleData): Promise<void> => {
  const { companyId, actorUserId, actorRole, id, role } =
    changeRoleSchema.parse(data)
  const actor = { userId: actorUserId, role: actorRole }
  await findManageable({ id, companyId, actor, canManage: canManageMember })
  if (!getAssignableRoles(actorRole).includes(role)) {
    throw new Error(`User ${actorUserId} can't assign the role ${role}`)
  }
  await memberRepository.updateRole({ id, companyId, role })
}

const transferOwnership = async (data: TMemberActionData): Promise<void> => {
  const { companyId, actorUserId, actorRole, id } =
    memberActionSchema.parse(data)
  const actor = { userId: actorUserId, role: actorRole }
  await findManageable({
    id,
    companyId,
    actor,
    canManage: canTransferOwnership
  })
  const members = await memberRepository.findManyByCompanyId(companyId)
  const owner = members.find(({ userId }) => userId === actorUserId)
  if (!owner) {
    throw new Error(`User ${actorUserId} is not a member of ${companyId}`)
  }
  await memberRepository.transferOwnership({
    companyId,
    fromId: owner.id,
    toId: id,
    ownerRole: OWNER_ROLE,
    previousOwnerRole: ADMIN_ROLE
  })
}

const remove = async (data: TMemberActionData): Promise<void> => {
  const { companyId, actorUserId, actorRole, id } =
    memberActionSchema.parse(data)
  const actor = { userId: actorUserId, role: actorRole }
  await findManageable({ id, companyId, actor, canManage: canManageMember })
  await memberRepository.remove({ id, companyId })
}

export const memberModel = {
  findManyByCompanyId,
  add,
  changeRole,
  transferOwnership,
  remove
}
