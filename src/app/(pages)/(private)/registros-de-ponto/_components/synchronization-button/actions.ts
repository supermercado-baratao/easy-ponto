'use server'

import { refresh } from 'next/cache'

import { synchronizationModel } from '@/models/synchronization/model'
import { TAfdSynchronizationParams } from '@/models/synchronization/types'

import { TSynchronizationState } from './types'

export const synchronize = async (
  params: TAfdSynchronizationParams,
  state: TSynchronizationState
): Promise<TSynchronizationState> => {
  try {
    await synchronizationModel.synchronizeAfd(params)
    refresh()
    return { ...state, success: true, fatalError: false }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
