'use server'

import { TState } from '@/infra/form-action'
import {
  punchRecordModel,
  synchronizationModel,
  TAfdSynchronizationParams,
  TUserSynchronizationParams,
  userModel
} from '@/models'

import { TData } from './types'

export const importFromDevice = async (
  params: {
    userPis: string
    userParams: TUserSynchronizationParams
    afdParams: TAfdSynchronizationParams
  },
  state: TState<TUserSynchronizationParams, TData>
): Promise<TState<TUserSynchronizationParams, TData>> => {
  try {
    await synchronizationModel.receive.users(params.userParams)
    await synchronizationModel.receive.afd(params.afdParams)
    const users = await userModel.findManyByCompanyId(
      params.userParams.companyId
    )
    const punchRecords = await punchRecordModel.findMany({
      pis: params.userPis
    })
    return {
      ...state,
      success: true,
      data: { users, punchRecords }
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
