'use server'

import { synchronizationModel } from '@/models/synchronization-model/synchronization.model'
import { TAfdSynchronizationParams } from '@/models/synchronization-model/types'

import { TSynchronizationState } from './types'

export const synchronize = async (
  params: TAfdSynchronizationParams,
  state: TSynchronizationState
): Promise<TSynchronizationState> => {
  try {
    const data = await synchronizationModel.synchronizeAfd(params)
    return {
      ...state,
      success: true,
      data: {
        user: data.user,
        users: data.users
      }
    }
  } catch (error) {
    console.error(error)
    return {
      ...state,
      success: false,
      fatalError: true
    }
  }
}
