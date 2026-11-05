'use server'

import { handleFormAction } from '@/infra/form-action'
import { companyModel } from '@/models/company/model'
import { synchronizationModel } from '@/models/synchronization/model'
import { TCompanySynchronizationParams } from '@/models/synchronization/types'

import { TCompanyState } from './types'

export const save = async (
  state: TCompanyState,
  formData: FormData
): Promise<TCompanyState> =>
  await handleFormAction(companyModel.upsert, state, formData)

export const importFromDevice = async (
  params: TCompanySynchronizationParams,
  state: TCompanyState
): Promise<TCompanyState> => {
  try {
    const data = await synchronizationModel.synchronizeCompany(params)
    return {
      ...state,
      data,
      success: true
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
