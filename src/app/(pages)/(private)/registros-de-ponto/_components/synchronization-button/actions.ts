'use server'

import { refresh } from 'next/cache'

import { getAdminUser } from '@/entry/admin-user'
import { synchronizationModel } from '@/models/synchronization/model'

import { TSynchronizationState } from './types'

export const synchronize = async (
  state: TSynchronizationState
): Promise<TSynchronizationState> => {
  try {
    const { id, companyId, deviceCredentials } = await getAdminUser()
    if (!companyId || !deviceCredentials) {
      throw new Error(`AdminUser ${id} has no company or device`)
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
