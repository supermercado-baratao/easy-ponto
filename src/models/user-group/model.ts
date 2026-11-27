import { z } from 'zod'

import type { UserGroup, UserGroupMember } from '@/infra/database/types'
import { userGroupRepository } from '@/repositories/user-group-repository'

import { UserGroupHasChildrenError, UserGroupNotFoundError } from './errors'
import {
  createSchema,
  findManyByCompanyIdSchema,
  removeSchema,
  updateSchema
} from './schema'
import type {
  TUserGroupCreateData,
  TUserGroupRemoveParams,
  TUserGroupUpdateData
} from './types'
import { getDescendantIds, isSameGroupName } from './utils'

const fieldError = (
  path: 'name' | 'parentId',
  message: string,
  input: unknown
): z.ZodError =>
  new z.ZodError([{ code: 'custom', path: [path], message, input }])

const assertValidGroup = async ({
  id,
  companyId,
  name,
  parentId
}: Pick<UserGroup, 'companyId' | 'name' | 'parentId'> & {
  id?: string
}): Promise<void> => {
  const groups = await userGroupRepository.findManyByCompanyId(companyId)
  if (
    groups.some((group) => isSameGroupName(group.name, name) && group.id !== id)
  ) {
    throw fieldError('name', 'Já existe um grupo com esse nome', name)
  }
  if (!parentId) return

  if (groups.every((group) => group.id !== parentId)) {
    throw new UserGroupNotFoundError(
      `Parent UserGroup ${parentId} not found in company ${companyId}`
    )
  }
  if (id && getDescendantIds(groups, id).has(parentId)) {
    throw fieldError(
      'parentId',
      'O grupo acima não pode ser um grupo de dentro dele',
      parentId
    )
  }
}

const findManyByCompanyId = async (companyId: string): Promise<UserGroup[]> =>
  await userGroupRepository.findManyByCompanyId(
    findManyByCompanyIdSchema.parse(companyId)
  )

const findMembersByCompanyId = async (
  companyId: string
): Promise<Pick<UserGroupMember, 'groupId' | 'userId'>[]> =>
  await userGroupRepository.findMembersByCompanyId(
    findManyByCompanyIdSchema.parse(companyId)
  )

const create = async (data: TUserGroupCreateData): Promise<UserGroup> => {
  const validData = createSchema.parse(data)
  await assertValidGroup(validData)
  return await userGroupRepository.create(validData)
}

const update = async (data: TUserGroupUpdateData): Promise<UserGroup> => {
  const validData = updateSchema.parse(data)
  await assertValidGroup(validData)
  const group = await userGroupRepository.update(validData)
  if (!group) {
    throw new UserGroupNotFoundError(
      `UserGroup ${validData.id} not found in company ${validData.companyId}`
    )
  }
  return group
}

const remove = async (params: TUserGroupRemoveParams): Promise<UserGroup> => {
  const validParams = removeSchema.parse(params)
  const groups = await userGroupRepository.findManyByCompanyId(
    validParams.companyId
  )
  const group = groups.find(({ id }) => id === validParams.id)
  if (!group) {
    throw new UserGroupNotFoundError(
      `UserGroup ${validParams.id} not found in company ${validParams.companyId}`
    )
  }
  if (groups.some(({ parentId }) => parentId === group.id)) {
    throw new UserGroupHasChildrenError(group.name)
  }
  await userGroupRepository.remove(validParams)
  return group
}

export const userGroupModel = {
  findManyByCompanyId,
  findMembersByCompanyId,
  create,
  update,
  remove
}
