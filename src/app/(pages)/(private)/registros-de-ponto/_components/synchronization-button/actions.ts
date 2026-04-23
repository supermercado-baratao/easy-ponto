'use server'

import { revalidatePath } from 'next/cache'

import { synchronizationModel, TAfdSynchronizationParams } from '@/models'

import { TSynchronizationState } from './types'

export const synchronize = async (
  params: TAfdSynchronizationParams,
  state: TSynchronizationState
): Promise<TSynchronizationState> => {
  try {
    await synchronizationModel.synchronizeAfd(params)
    revalidatePath('/registros-de-ponto', 'layout')
    return { ...state, success: true }
  } catch (error) {
    console.error(error)
    return { ...state, success: false, fatalError: true }
  }
}
