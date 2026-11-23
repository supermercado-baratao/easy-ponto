'use server'

import { refresh } from 'next/cache'

import { handleAction } from '@/entry/action'
import { requireEditor } from '@/entry/session'
import { synchronizationModel } from '@/models/synchronization/model'

import { TSynchronizationState } from './types'

export const synchronize = async (): Promise<TSynchronizationState> => {
  const {
    company: { id: companyId, deviceCredentials }
  } = await requireEditor()
  return await handleAction(async () => {
    await synchronizationModel.synchronizeAfd({
      companyId,
      credentials: deviceCredentials,
      params: {}
    })
    refresh()
    return null
  })
}
