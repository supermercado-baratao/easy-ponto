'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { userGroupModel } from '@/models/user-group/model'

import type { TRemoveUserGroupState } from './types'

export const removeUserGroup = async (
  _state: TRemoveUserGroupState,
  formData: FormData
): Promise<TRemoveUserGroupState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await userGroupModel.remove({
      id: formData.get('id') as string,
      companyId
    })
    refresh()
    return null
  })
}
