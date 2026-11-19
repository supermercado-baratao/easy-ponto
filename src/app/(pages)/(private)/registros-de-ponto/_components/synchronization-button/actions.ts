'use server'

import { refresh } from 'next/cache'

import { requireEditor } from '@/entry/session'
import { synchronizationModel } from '@/models/synchronization/model'

import { TSynchronizationState } from './types'

export const synchronize = async (
  state: TSynchronizationState
): Promise<TSynchronizationState> => {
  const {
    company: { id: companyId, deviceCredentials }
  } = await requireEditor()
  try {
    if (!deviceCredentials) {
      throw new Error(`Company ${companyId} has no device`)
    }
    await synchronizationModel.synchronizeAfd({
      companyId,
      credentials: deviceCredentials,
      params: {}
    })
    refresh()
    return { ...state, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
