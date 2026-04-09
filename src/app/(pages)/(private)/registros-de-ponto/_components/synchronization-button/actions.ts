'use server'

import { synchronizationModel, TAfdSynchronizationParams } from '@/models'

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
