'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { ValidationError } from '@/infra/errors'
import { memberModel } from '@/models/member/model'

import type { TMemberActionState } from './types'

const getActorData = async (): Promise<{
  companyId: string
  actorUserId: string
  actorRole: string
}> => {
  const { user, role, company } = await requireEditor()
  return { companyId: company.id, actorUserId: user.id, actorRole: role }
}

const runMemberAction = async (
  action: () => Promise<void>
): Promise<TMemberActionState> => {
  try {
    await action()
    refresh()
    return { success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    if (error instanceof ValidationError) {
      return {
        success: false,
        fatalError: false,
        message: error.message,
        action: error.action
      }
    }
    return { success: false, fatalError: true }
  }
}

export const changeMemberRole = async ({
  id,
  role
}: {
  id: string
  role: string
}): Promise<TMemberActionState> => {
  const actor = await getActorData()
  return await runMemberAction(() =>
    memberModel.changeRole({ ...actor, id, role })
  )
}

export const transferOwnership = async (
  _state: TMemberActionState,
  formData: FormData
): Promise<TMemberActionState> => {
  const actor = await getActorData()
  return await runMemberAction(() =>
    memberModel.transferOwnership({
      ...actor,
      id: formData.get('id') as string
    })
  )
}

export const removeMember = async (
  _state: TMemberActionState,
  formData: FormData
): Promise<TMemberActionState> => {
  const actor = await getActorData()
  return await runMemberAction(() =>
    memberModel.remove({ ...actor, id: formData.get('id') as string })
  )
}
