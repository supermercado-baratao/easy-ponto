'use server'

import { Company } from '@prisma/client'

import { handleFormAction, TState } from '@/infra/form-action'
import {
  companyModel,
  synchronizationModel,
  TCompanyFormData,
  TCompanySynchronizationParams
} from '@/models'

export const save = async (
  state: TState<TCompanyFormData, Company>,
  formData: FormData
): Promise<TState<TCompanyFormData, Company>> =>
  await handleFormAction(companyModel.upsert, state, formData)

export const importFromDevice = async (
  params: TCompanySynchronizationParams,
  state: TState<TCompanySynchronizationParams, Company>
): Promise<TState<TCompanySynchronizationParams, Company>> => {
  try {
    const data = await synchronizationModel.receive.company(params)
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
