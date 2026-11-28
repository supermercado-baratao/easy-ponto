'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { pendingItemModel } from '@/models/pending-item/model'

import type { TDismissalState } from './types'

export const dismissPendingItem = async (
  _state: TDismissalState,
  formData: FormData
): Promise<TDismissalState> => {
  const {
    user,
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await pendingItemModel.dismiss({
      companyId,
      key: formData.get('key') as string,
      dismissedById: user.id
    })
    refresh()
    return null
  })
}

export const restorePendingItem = async (
  _state: TDismissalState,
  formData: FormData
): Promise<TDismissalState> => {
  const {
    company: { id: companyId }
  } = await requireEditor()
  return await handleAction(async () => {
    await pendingItemModel.restore({
      companyId,
      key: formData.get('key') as string
    })
    refresh()
    return null
  })
}
