'use server'

import { synchronizationModel } from '@/models'

import { TBindParams, TImportFileState } from './types'

export const importFile = async (
  params: TBindParams,
  state: TImportFileState,
  formData: FormData
): Promise<TImportFileState> => {
  try {
    const file = formData.get('file') as File
    const company = await synchronizationModel.importFile({
      file,
      company: params.company,
      credentials: params.credentials
    })
    return {
      ...state,
      data: company,
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
